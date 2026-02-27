import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SetPasswordDto } from '../dto/set-password.dto';
import { EmailService } from '../../email/email.service';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class PasswordAuthService {
  private readonly logger = new Logger(PasswordAuthService.name);
  private readonly TOKEN_EXPIRY_HOURS = 1;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokenPair(user.id, user.email);

    return { user, accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60),
      );
      this.logger.warn(`帳號鎖定中: ${email}，剩餘 ${remainingMinutes} 分鐘`);
      throw new UnauthorizedException(
        `帳號已暫時鎖定，請在 ${remainingMinutes} 分鐘後再試`,
      );
    }

    // Reset if lockout expired
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Google-only user cannot use password login
    if (!user.password) {
      throw new UnauthorizedException(
        '此帳戶使用 Google 登入，請使用 Google 登入',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - newFailedAttempts;

      if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(
          Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newFailedAttempts, lockedUntil },
        });
        this.logger.warn(
          `帳號已鎖定: ${email}，連續失敗 ${newFailedAttempts} 次`,
        );
        throw new UnauthorizedException(
          `登入失敗次數過多，帳號已鎖定 ${this.LOCKOUT_DURATION_MINUTES} 分鐘`,
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newFailedAttempts },
        });
        throw new UnauthorizedException(
          remainingAttempts <= 2
            ? `密碼錯誤，還剩 ${remainingAttempts} 次嘗試機會`
            : 'Invalid credentials',
        );
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('您的帳號已被停用，請聯絡客服');
    }

    // Login success: reset failure count
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokenPair(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same message regardless of user existence (security)
    if (!user || !user.password) {
      this.logger.log(`忘記密碼請求 - ${!user ? '找不到用戶' : 'Google 用戶'}: ${email}`);
      return { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
    }

    // Delete previous unused tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const sent = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.name,
    );

    if (!sent) {
      this.logger.error(`發送重設密碼郵件失敗: ${email}`);
    }

    return { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) throw new BadRequestException('無效的重設連結');
    if (resetToken.expiresAt < new Date())
      throw new BadRequestException('重設連結已過期，請重新申請');
    if (resetToken.usedAt) throw new BadRequestException('此重設連結已被使用');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`密碼已重設: ${resetToken.user.email}`);
    return { message: '密碼已成功重設，請使用新密碼登入' };
  }

  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) throw new BadRequestException('無效的重設連結');
    if (resetToken.expiresAt < new Date())
      throw new BadRequestException('重設連結已過期');
    if (resetToken.usedAt) throw new BadRequestException('此重設連結已被使用');

    return { valid: true };
  }

  async setPassword(userId: string, setPasswordDto: SetPasswordDto) {
    const { password } = setPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('用戶不存在');
    if (!user.googleId)
      throw new BadRequestException('此功能僅供 Google 登入用戶使用');
    if (user.password)
      throw new BadRequestException('您已設定過密碼，如需修改請使用修改密碼功能');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Google 用戶已設定密碼: ${user.email}`);
    return { message: '密碼設定成功，現在您可以使用 Email 和密碼登入' };
  }
}
