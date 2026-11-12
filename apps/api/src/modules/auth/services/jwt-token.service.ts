import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly REFRESH_TOKEN_DAYS = 30;
  /** Reuse of a token rotated less than this long ago is a concurrent tab, not theft */
  private readonly REUSE_GRACE_MS = 30_000;

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
      // Two tabs refreshing at once is normal: the second one sends the token
      // the first one just rotated (its new cookie arrives a moment later).
      // Within the grace window reject without punishing — nothing is issued,
      // so a stolen token replayed in this window still gets nothing.
      const sinceRevokedMs = Date.now() - stored.revokedAt.getTime();
      if (sinceRevokedMs < this.REUSE_GRACE_MS) {
        throw new UnauthorizedException('Refresh token was just rotated');
      }

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

    // Rotation: revoke old token only if still unrevoked, so two concurrent
    // requests with the same token can't both rotate it into two live pairs.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      throw new UnauthorizedException('Refresh token was just rotated');
    }

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
