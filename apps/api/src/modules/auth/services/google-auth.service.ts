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
   * - Existing user by email → link Google account (verified email only)
   * - New user → create account (verified email only)
   *
   * Password registration does not verify email, so an attacker can register a
   * victim's address first (account pre-hijacking). Linking therefore requires
   * Google to vouch for the email, and clears the existing password and sessions:
   * whoever set them never proved they own the address. The real owner can set a
   * password again from the account page (PasswordAuthService.setPassword) after
   * signing in with Google; forgot-password does not mail password-less users.
   */
  async validateGoogleUser(profile: GoogleProfile) {
    const { googleId, email, name, avatar, emailVerified } = profile;

    // 1. Find by googleId
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
      return user;
    }

    if (!emailVerified) {
      throw new UnauthorizedException(
        '此 Google 帳號的 email 尚未驗證，請改用已驗證 email 的帳號登入',
      );
    }

    // 2. Find by email (may be a password-registered user)
    user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // googleLogin would refuse a deactivated account anyway; refuse before
      // wiping its password so a later reactivation still works.
      if (!user.isActive) {
        throw new UnauthorizedException('您的帳號已被停用，請聯絡客服');
      }
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar, password: null },
      });
      await this.jwtTokenService.revokeAllUserTokens(user.id);
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
