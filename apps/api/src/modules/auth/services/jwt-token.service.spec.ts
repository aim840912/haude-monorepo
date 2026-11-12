import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';

/**
 * refreshAccessToken — 重複使用偵測的寬限期
 *
 * 回歸防護：兩個分頁同時刷新時，第二個分頁送出的是剛被第一個分頁換掉的舊
 * refresh token。舊版一看到已撤銷的 token 就當成遭竊並撤銷全部，使用者所有
 * 分頁、所有裝置都被登出。
 */
describe('JwtTokenService.refreshAccessToken', () => {
  const NOW = new Date('2026-11-12T10:00:00.000Z');
  const user = { id: 'user-1', email: 'u@example.com', isActive: true };

  let prisma: {
    refreshToken: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };
  let service: JwtTokenService;

  function storedToken(overrides: { revokedAt?: Date | null } = {}) {
    return {
      id: 'rt-1',
      userId: user.id,
      token: 'old-token',
      expiresAt: new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
      revokedAt: null,
      user,
      ...overrides,
    };
  }

  /** True when updateMany was called to revoke every token of the user */
  function revokedAll(): boolean {
    return prisma.refreshToken.updateMany.mock.calls.some(
      ([args]) => args.where.userId === user.id && !('id' in args.where),
    );
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const jwt = { sign: jest.fn().mockReturnValue('access') };
    service = new JwtTokenService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('30 秒內重複使用剛換掉的舊 token：回 409（前端會等新 cookie），不撤銷全部', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(
      storedToken({ revokedAt: new Date(NOW.getTime() - 5_000) }),
    );

    await expect(service.refreshAccessToken('old-token')).rejects.toThrow(
      ConflictException,
    );

    expect(revokedAll()).toBe(false);
  });

  it('超過 30 秒後重複使用舊 token：當成遭竊，撤銷全部', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(
      storedToken({ revokedAt: new Date(NOW.getTime() - 31_000) }),
    );

    await expect(service.refreshAccessToken('old-token')).rejects.toThrow(
      UnauthorizedException,
    );

    expect(revokedAll()).toBe(true);
  });

  it('正常輪替：只在 token 仍未撤銷時寫入，並發出新的一組', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(storedToken());

    const result = await service.refreshAccessToken('old-token');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'rt-1', revokedAt: null },
      data: { revokedAt: NOW },
    });
    expect(result.accessToken).toBe('access');
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('兩個請求同時輪替同一個 token：後到的不發新 token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(storedToken());
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.refreshAccessToken('old-token')).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
});
