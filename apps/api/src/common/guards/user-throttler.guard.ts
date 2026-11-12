import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';

/**
 * Per-User Rate Limiting Guard
 *
 * Tracks rate limits by:
 * - Authenticated users: user ID from a *verified* access_token cookie
 * - Anonymous users: IP address (default behavior)
 *
 * This is a global guard, so it runs before JwtAuthGuard: req.user is never
 * set here. The cookie is verified directly instead — a forged or expired
 * token falls back to IP, so it can't be used to mint fresh quotas.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = this.verifiedUserId(req);
    if (userId) {
      return `user:${userId}`;
    }

    // Anonymous: the client IP as Cloudflare (in front of Render) saw it.
    // req.ip is useless here — measured 2026-11-12, it is 127.0.0.1 for every
    // request, so everyone shared one quota. cf-connecting-ip is set by
    // Cloudflare and a request forging it is rejected at the edge (403);
    // x-forwarded-for and x-vercel-forwarded-for pass through forged, so they
    // must not be used.
    // shortcut: web/admin traffic arrives via Vercel's proxy, so this is a
    // Vercel egress IP shared by its users. Upgrade path: trust
    // x-vercel-forwarded-for only after verifying x-vercel-proxy-signature.
    const cfIp = (req.headers as Record<string, unknown> | undefined)?.[
      'cf-connecting-ip'
    ];
    if (typeof cfIp === 'string' && cfIp) {
      return cfIp;
    }
    return super.getTracker(req);
  }

  private verifiedUserId(req: Record<string, unknown>): string | undefined {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.access_token;
    if (!token) return undefined;
    try {
      return this.jwtService.verify<{ sub: string }>(token).sub;
    } catch {
      return undefined;
    }
  }
}
