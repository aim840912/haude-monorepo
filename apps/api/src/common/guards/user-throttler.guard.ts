import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Per-User Rate Limiting Guard
 *
 * Extends the default ThrottlerGuard to track rate limits by:
 * - Authenticated users: user ID (prevents quota sharing on shared IPs)
 * - Anonymous users: IP address (default behavior)
 *
 * This ensures a single authenticated user can't exhaust the quota
 * for other users behind the same corporate network/VPN.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // If user is authenticated, use their ID for rate limiting
    const user = req.user as { userId?: string } | undefined;
    if (user?.userId) {
      return `user:${user.userId}`;
    }

    // Fallback to IP for anonymous requests
    return super.getTracker(req);
  }
}
