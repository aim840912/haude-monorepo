import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
