import { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { UserThrottlerGuard } from './user-throttler.guard';

/**
 * 限流的追蹤鍵
 *
 * 回歸防護：這是全域 guard，執行時 JwtAuthGuard 還沒跑、req.user 一定是空的，
 * 舊版「登入者用 user ID」的分支從來沒生效過 —— 所有人都以 IP 計，而 Render
 * 與 Vercel 代理讓大家看起來是同幾個 IP，整站共用一份額度。
 */
describe('UserThrottlerGuard.getTracker', () => {
  const jwt = { verify: jest.fn() };
  const guard = new UserThrottlerGuard(
    {} as ThrottlerModuleOptions,
    {} as ThrottlerStorage,
    new Reflector(),
    jwt as unknown as JwtService,
  );
  const track = (req: Record<string, unknown>) =>
    (
      guard as unknown as {
        getTracker(r: Record<string, unknown>): Promise<string>;
      }
    ).getTracker(req);

  beforeEach(() => jwt.verify.mockReset());

  it('有效的 access_token cookie → 以使用者 ID 限流', async () => {
    jwt.verify.mockReturnValue({ sub: 'user-1' });

    await expect(
      track({ ip: '10.0.0.1', cookies: { access_token: 'good' } }),
    ).resolves.toBe('user:user-1');
  });

  it('偽造或過期的 token → 退回 IP（不能靠假 token 換到新額度）', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      track({ ip: '10.0.0.1', cookies: { access_token: 'forged' } }),
    ).resolves.toBe('10.0.0.1');
  });

  it('沒有 cookie → 以 IP 限流', async () => {
    await expect(track({ ip: '10.0.0.1', cookies: {} })).resolves.toBe(
      '10.0.0.1',
    );
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  // 2026-11-12 線上實測（Render log）：每個請求的 req.ip 都是 127.0.0.1，
  // 全站匿名請求共用一份額度。cf-connecting-ip 由 Cloudflare 設定，
  // 偽造它的請求在邊緣層就被 403 擋掉。
  it('匿名請求以 cf-connecting-ip 限流，不用 req.ip（永遠是 127.0.0.1）', async () => {
    await expect(
      track({
        ip: '127.0.0.1',
        headers: { 'cf-connecting-ip': '220.143.33.199' },
        cookies: {},
      }),
    ).resolves.toBe('220.143.33.199');
  });

  it('可偽造的 x-forwarded-for / x-vercel-forwarded-for 不採用', async () => {
    await expect(
      track({
        ip: '127.0.0.1',
        headers: {
          'cf-connecting-ip': '220.143.33.199',
          'x-forwarded-for': '1.2.3.4, 220.143.33.199',
          'x-vercel-forwarded-for': '9.9.9.9',
        },
        cookies: {},
      }),
    ).resolves.toBe('220.143.33.199');
  });
});
