import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtTokenService } from './jwt-token.service';
import { PasswordAuthService } from './password-auth.service';

/**
 * Refresh and password-reset tokens are bearer credentials. Stored in plain
 * text, a database leak (backup, log, SQL injection elsewhere) hands every
 * active session and every pending reset link to the reader. Only a SHA-256
 * hash is stored; the raw value lives only in the cookie / email link.
 */
const sha256 = (raw: string) => createHash('sha256').update(raw).digest('hex');

describe('token storage: only hashes reach the database', () => {
  describe('refresh tokens', () => {
    const prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new JwtTokenService(
      prisma as unknown as PrismaService,
      { sign: jest.fn().mockReturnValue('access') } as unknown as JwtService,
    );

    beforeEach(() => jest.clearAllMocks());

    it('stores the hash of the token it returns', async () => {
      const { refreshToken } = await service.generateTokenPair('u-1', 'a@b.c');

      const stored = prisma.refreshToken.create.mock.calls[0][0].data.token;
      expect(stored).not.toBe(refreshToken);
      expect(stored).toBe(sha256(refreshToken));
    });

    it('looks a presented token up by its hash', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await service.refreshAccessToken('raw-token').catch(() => undefined);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: sha256('raw-token') } }),
      );
    });

    it('logout without a refresh cookie is a silent no-op (no 500)', async () => {
      await expect(
        service.revokeRefreshToken(undefined as unknown as string),
      ).resolves.toBeUndefined();
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('revokes on logout by hash', async () => {
      await service.revokeRefreshToken('raw-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: sha256('raw-token') } }),
      );
    });
  });

  describe('password reset tokens', () => {
    const prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    const email = { sendPasswordResetEmail: jest.fn().mockResolvedValue(true) };
    const service = new PasswordAuthService(
      prisma as unknown as PrismaService,
      { revokeAllUserTokens: jest.fn() } as unknown as JwtTokenService,
      email as unknown as EmailService,
    );

    beforeEach(() => jest.clearAllMocks());

    it('emails the raw token but stores only its hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.c',
        name: 'A',
        password: 'hash',
      });

      await service.forgotPassword({ email: 'a@b.c' });

      const resetUrl: string = email.sendPasswordResetEmail.mock.calls[0][1];
      const raw = new URL(resetUrl).searchParams.get('token') as string;
      const stored =
        prisma.passwordResetToken.create.mock.calls[0][0].data.token;
      expect(stored).toBe(sha256(raw));
      expect(stored).not.toBe(raw);
    });

    it.each(['resetPassword', 'verifyResetToken'] as const)(
      '%s looks the token up by its hash',
      async (method) => {
        prisma.passwordResetToken.findUnique.mockResolvedValue(null);

        const call =
          method === 'resetPassword'
            ? service.resetPassword({
                token: 'raw',
                newPassword: 'NewPass123!',
              })
            : service.verifyResetToken('raw');
        await call.catch(() => undefined);

        expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { token: sha256('raw') } }),
        );
      },
    );
  });
});
