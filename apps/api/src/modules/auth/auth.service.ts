import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { GoogleProfile } from './strategies/google.strategy';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordAuthService } from './services/password-auth.service';
import { GoogleAuthService } from './services/google-auth.service';

/**
 * AuthService — Facade
 *
 * Delegates to specialized services while preserving the original public API
 * so that AuthController and GoogleStrategy need no changes.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordAuthService: PasswordAuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  // === Google OAuth ===

  async validateGoogleUser(profile: GoogleProfile) {
    return this.googleAuthService.validateGoogleUser(profile);
  }

  async googleLogin(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }) {
    return this.googleAuthService.googleLogin(user);
  }

  // === Password Auth ===

  async register(registerDto: RegisterDto) {
    return this.passwordAuthService.register(registerDto);
  }

  async login(loginDto: LoginDto) {
    return this.passwordAuthService.login(loginDto);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordAuthService.forgotPassword(forgotPasswordDto);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    return this.passwordAuthService.resetPassword(resetPasswordDto);
  }

  async verifyResetToken(token: string) {
    return this.passwordAuthService.verifyResetToken(token);
  }

  async setPassword(userId: string, setPasswordDto: SetPasswordDto) {
    return this.passwordAuthService.setPassword(userId, setPasswordDto);
  }

  // === User queries ===

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

    const { password, googleId, ...safeUser } = user;

    return {
      user: {
        ...safeUser,
        hasPassword: !!password,
        isGoogleUser: !!googleId,
      },
    };
  }

  // === Token management ===

  async generateTokenPair(userId: string, email: string) {
    return this.jwtTokenService.generateTokenPair(userId, email);
  }

  async refreshAccessToken(refreshToken: string) {
    return this.jwtTokenService.refreshAccessToken(refreshToken);
  }

  async revokeRefreshToken(refreshToken: string) {
    return this.jwtTokenService.revokeRefreshToken(refreshToken);
  }

  async revokeAllUserTokens(userId: string) {
    return this.jwtTokenService.revokeAllUserTokens(userId);
  }

  async cleanupExpiredTokens() {
    return this.jwtTokenService.cleanupExpiredTokens();
  }

  // === Dev helpers ===

  async findFirstAdmin() {
    return this.prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });
  }

  async createDevAdmin(email: string, name: string) {
    return this.prisma.user.create({
      data: { email, name, role: 'ADMIN', isActive: true },
    });
  }
}
