import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleAuthService } from './google-auth.service';
import { JwtTokenService } from './jwt-token.service';

/**
 * Account pre-hijacking: registration does not verify email, so anyone can
 * register a victim's address with a password they know. When the victim later
 * signs in with Google, linking by email must not leave the attacker's password
 * or sessions working.
 */
describe('GoogleAuthService.validateGoogleUser', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwtTokens = { revokeAllUserTokens: jest.fn() };

  const service = new GoogleAuthService(
    prisma as unknown as PrismaService,
    jwtTokens as unknown as JwtTokenService,
  );

  const profile = {
    googleId: 'g-1',
    email: 'victim@example.com',
    name: 'Victim',
    avatar: 'https://example.com/a.png',
    emailVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'u-1', ...data }),
    );
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'u-new', ...data }),
    );
  });

  /** No user by googleId; optionally one by email. */
  const givenUsers = (byEmail: object | null) => {
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { googleId?: string; email?: string } }) =>
        Promise.resolve(where.googleId ? null : byEmail),
    );
  };

  it('linking Google to an existing password account clears that password and revokes its sessions', async () => {
    givenUsers({
      id: 'u-1',
      email: profile.email,
      password: 'attacker-hash',
      isActive: true,
    });

    await service.validateGoogleUser(profile);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { googleId: 'g-1', avatar: profile.avatar, password: null },
    });
    expect(jwtTokens.revokeAllUserTokens).toHaveBeenCalledWith('u-1');
  });

  it('does not touch a deactivated account (login is refused later anyway)', async () => {
    givenUsers({
      id: 'u-1',
      email: profile.email,
      password: 'hash',
      isActive: false,
    });

    await expect(service.validateGoogleUser(profile)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(jwtTokens.revokeAllUserTokens).not.toHaveBeenCalled();
  });

  it('refuses to link an existing account when Google has not verified the email', async () => {
    givenUsers({ id: 'u-1', email: profile.email, password: 'hash' });

    await expect(
      service.validateGoogleUser({ ...profile, emailVerified: false }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('refuses to create an account for an unverified Google email', async () => {
    givenUsers(null);

    await expect(
      service.validateGoogleUser({ ...profile, emailVerified: false }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a new account for a verified Google email', async () => {
    givenUsers(null);

    await service.validateGoogleUser(profile);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: profile.email,
        name: profile.name,
        googleId: 'g-1',
        avatar: profile.avatar,
      },
    });
    expect(jwtTokens.revokeAllUserTokens).not.toHaveBeenCalled();
  });

  it('an already-linked Google account signs in without touching password or sessions', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', googleId: 'g-1' });

    await service.validateGoogleUser({ ...profile, emailVerified: false });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { avatar: profile.avatar },
    });
    expect(jwtTokens.revokeAllUserTokens).not.toHaveBeenCalled();
  });
});
