import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleProfile } from '../strategies/google.strategy';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Validate and upsert a Google OAuth user
   * - Existing user by googleId → update avatar
   * - Existing user by email → link Google account
   * - New user → create account
   */
  async validateGoogleUser(profile: GoogleProfile) {
    const { googleId, email, name, avatar } = profile;

    // 1. Find by googleId
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
      return user;
    }

    // 2. Find by email (may be a password-registered user)
    user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar },
      });
      return user;
    }

    // 3. Create new user
    user = await this.prisma.user.create({
      data: { email, name, googleId, avatar },
    });

    return user;
  }

  /**
   * Issue token pair for a Google-authenticated user
   */
  async googleLogin(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }) {
    if (!user.isActive) {
      throw new UnauthorizedException('您的帳號已被停用，請聯絡客服');
    }

    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokenPair(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
