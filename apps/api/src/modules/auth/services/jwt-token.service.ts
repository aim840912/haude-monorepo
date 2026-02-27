import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly REFRESH_TOKEN_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate access token + refresh token pair
   * - Access token: JWT, 15 min
   * - Refresh token: crypto random, 30 days, stored in DB
   */
  async generateTokenPair(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Rotate refresh token — revoke old, issue new pair
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
      },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}`,
      );
      await this.revokeAllUserTokens(stored.userId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('帳戶已被停用');
    }

    // Rotation: revoke old token, generate new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokenPair(stored.user.id, stored.user.email);
  }

  /**
   * Revoke a single refresh token (called on logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken
      .update({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      })
      .catch(() => {
        // Token may not exist, ignore
      });
  }

  /**
   * Revoke all user refresh tokens (logout all devices / security event)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Cleanup expired refresh tokens (can be called by cron)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revokedAt: {
              not: null,
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });
    return result.count;
  }
}
