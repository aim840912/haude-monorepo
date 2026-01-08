import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { GoogleProfile } from './strategies/google.strategy';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly TOKEN_EXPIRY_HOURS = 1; // Token 有效期 1 小時

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * 處理 Google OAuth 用戶驗證
   * - 如果用戶已存在（透過 googleId 或 email），更新並返回
   * - 如果是新用戶，建立新帳戶
   */
  async validateGoogleUser(profile: GoogleProfile) {
    const { googleId, email, name, avatar } = profile;

    // 1. 先嘗試透過 googleId 查找
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      // 更新頭像（可能會變更）
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
      return user;
    }

    // 2. 透過 email 查找（可能是之前用密碼註冊的用戶）
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // 連結 Google 帳號到現有用戶
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar },
      });
      return user;
    }

    // 3. 建立新用戶
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        googleId,
        avatar,
        // password 為 null，表示這是 Google 登入用戶
      },
    });

    return user;
  }

  /**
   * 處理 Google OAuth 登入，返回 JWT Token
   */
  async googleLogin(user: { id: string; email: string; name: string; role: string }) {
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 如果用戶沒有密碼（Google 登入用戶），拒絕密碼登入
    if (!user.password) {
      throw new UnauthorizedException('此帳戶使用 Google 登入，請使用 Google 登入');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        password: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 不要回傳密碼，但回傳是否有密碼的狀態
    const { password, googleId, ...safeUser } = user;

    return {
      user: {
        ...safeUser,
        hasPassword: !!password,
        isGoogleUser: !!googleId,
      },
    };
  }

  /**
   * 忘記密碼 - 發送重設密碼郵件
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // 查找用戶
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 基於安全考量，無論用戶是否存在都返回相同訊息
    if (!user) {
      this.logger.log(`忘記密碼請求 - 找不到用戶: ${email}`);
      return { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
    }

    // 如果是 Google 登入用戶（沒有密碼），也返回相同訊息
    if (!user.password) {
      this.logger.log(`忘記密碼請求 - Google 用戶: ${email}`);
      return { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
    }

    // 刪除該用戶之前的未使用 token
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // 生成新的 token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // 儲存 token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 建立重設連結
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // 發送郵件
    const sent = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.name,
    );

    if (!sent) {
      this.logger.error(`發送重設密碼郵件失敗: ${email}`);
      // 不要暴露錯誤細節給用戶
    }

    return { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
  }

  /**
   * 重設密碼
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // 查找有效的 token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('無效的重設連結');
    }

    // 檢查 token 是否已過期
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('重設連結已過期，請重新申請');
    }

    // 檢查 token 是否已使用
    if (resetToken.usedAt) {
      throw new BadRequestException('此重設連結已被使用');
    }

    // 更新密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      // 更新用戶密碼
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // 標記 token 為已使用
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`密碼已重設: ${resetToken.user.email}`);

    return { message: '密碼已成功重設，請使用新密碼登入' };
  }

  /**
   * 驗證重設密碼 Token 是否有效
   */
  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('無效的重設連結');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('重設連結已過期');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('此重設連結已被使用');
    }

    return { valid: true };
  }

  /**
   * 為 Google 用戶設定密碼
   */
  async setPassword(userId: string, setPasswordDto: SetPasswordDto) {
    const { password } = setPasswordDto;

    // 查找用戶
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用戶不存在');
    }

    // 檢查是否為 Google 用戶
    if (!user.googleId) {
      throw new BadRequestException('此功能僅供 Google 登入用戶使用');
    }

    // 檢查是否已有密碼
    if (user.password) {
      throw new BadRequestException('您已設定過密碼，如需修改請使用修改密碼功能');
    }

    // Hash 並儲存密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Google 用戶已設定密碼: ${user.email}`);

    return { message: '密碼設定成功，現在您可以使用 Email 和密碼登入' };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
