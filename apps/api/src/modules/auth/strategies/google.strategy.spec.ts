import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import {
  GoogleStrategy,
  isValidOAuthNonce,
  parseOAuthState,
  resolveGoogleAuthOptions,
} from './google.strategy';

describe('OAuth state nonce (login CSRF)', () => {
  it('puts the nonce into the authorization state after the target', () => {
    expect(
      resolveGoogleAuthOptions({ redirect: 'admin' }, {}, 'n1').state,
    ).toBe('admin.n1');
    expect(resolveGoogleAuthOptions({}, {}, 'n1').state).toBe('web.n1');
  });

  it('re-derives the target from a nonce-carrying state on callback', () => {
    expect(
      resolveGoogleAuthOptions(
        { code: 'abc', state: 'admin.n1' },
        { admin: 'https://a/cb' },
      ),
    ).toEqual({ state: 'admin', callbackURL: 'https://a/cb' });
  });

  it.each([
    ['admin.n1', { target: 'admin', nonce: 'n1' }],
    ['web.n1', { target: 'web', nonce: 'n1' }],
    ['admin', { target: 'admin', nonce: undefined }],
    [undefined, { target: 'web', nonce: undefined }],
    ['evil.n1', { target: 'web', nonce: 'n1' }],
  ])('parses state %p', (raw, expected) => {
    expect(parseOAuthState(raw)).toEqual(expected);
  });

  it('accepts only a nonce matching the cookie', () => {
    expect(isValidOAuthNonce('abc123', 'abc123')).toBe(true);
    expect(isValidOAuthNonce('abc123', 'abc124')).toBe(false);
    expect(isValidOAuthNonce('abc', 'abc123')).toBe(false);
    expect(isValidOAuthNonce(undefined, 'abc123')).toBe(false);
    expect(isValidOAuthNonce('abc123', undefined)).toBe(false);
    expect(isValidOAuthNonce('', '')).toBe(false);
  });
});

const WEB_CALLBACK = 'https://haude-web.vercel.app/api/v1/auth/google/callback';
const ADMIN_CALLBACK =
  'https://haude-admin.vercel.app/api/v1/auth/google/callback';
const BOTH = { web: WEB_CALLBACK, admin: ADMIN_CALLBACK };

describe('resolveGoogleAuthOptions', () => {
  it('routes the web authorization request through the web callback', () => {
    expect(resolveGoogleAuthOptions({}, BOTH)).toEqual({
      state: 'web',
      callbackURL: WEB_CALLBACK,
    });
  });

  it('routes the admin authorization request through the admin callback', () => {
    // Admin proxies /api/v1 through its own origin too, so its auth cookies
    // must be set there (first-party), not on onrender.com
    expect(resolveGoogleAuthOptions({ redirect: 'admin' }, BOTH)).toEqual({
      state: 'admin',
      callbackURL: ADMIN_CALLBACK,
      prompt: 'select_account',
    });
  });

  it('always shows the Google account chooser for admin sign-in', () => {
    // Logging out of admin does not sign the browser out of Google, so without
    // this Google silently reuses the last account and a second admin on the
    // same machine can never switch in
    expect(resolveGoogleAuthOptions({ redirect: 'admin' }, {})).toEqual({
      state: 'admin',
      prompt: 'select_account',
    });
  });

  it('keeps one-click Google sign-in for web customers', () => {
    expect(resolveGoogleAuthOptions({}, BOTH)).not.toHaveProperty('prompt');
  });

  it('keeps admin on the default callback when no admin callback is configured', () => {
    expect(
      resolveGoogleAuthOptions({ redirect: 'admin' }, { web: WEB_CALLBACK }),
    ).toEqual({ state: 'admin', prompt: 'select_account' });
  });

  it('re-derives the web callback from state when Google returns the code', () => {
    // Token exchange must send the same redirect_uri as the authorization step
    expect(
      resolveGoogleAuthOptions({ code: 'abc', state: 'web' }, BOTH),
    ).toEqual({ state: 'web', callbackURL: WEB_CALLBACK });
  });

  it('re-derives the admin callback from state when Google returns the code', () => {
    expect(
      resolveGoogleAuthOptions({ code: 'abc', state: 'admin' }, BOTH),
    ).toEqual({ state: 'admin', callbackURL: ADMIN_CALLBACK });
  });

  it('keeps admin when Google returns an error instead of a code', () => {
    expect(
      resolveGoogleAuthOptions(
        { error: 'access_denied', state: 'admin' },
        BOTH,
      ),
    ).toEqual({ state: 'admin', callbackURL: ADMIN_CALLBACK });
  });

  it('falls back to the default callback when nothing is configured', () => {
    expect(resolveGoogleAuthOptions({}, {})).toEqual({ state: 'web' });
  });
});

describe('GoogleStrategy.validate (login CSRF before side effects)', () => {
  const authService = { validateGoogleUser: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('x') };
  const strategy = new GoogleStrategy(
    config as unknown as ConfigService,
    authService as unknown as AuthService,
  );
  const profile = {
    id: 'g-1',
    emails: [{ value: 'a@b.c' }],
    displayName: 'A',
    photos: [],
    _json: { email_verified: true },
  } as unknown as Profile;

  beforeEach(() => jest.clearAllMocks());

  it('rejects a nonce mismatch before creating or linking any account', async () => {
    const done = jest.fn();
    await strategy.validate(
      {
        query: { state: 'web.attacker' },
        cookies: { g_oauth_state: 'mine' },
      } as unknown as Request,
      'at',
      'rt',
      profile,
      done,
    );

    expect(authService.validateGoogleUser).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, {
      oauthState: 'web.attacker',
      oauthRejected: true,
    });
  });

  it('a matching nonce proceeds to account lookup', async () => {
    authService.validateGoogleUser.mockResolvedValue({ id: 'u-1' });
    const done = jest.fn();
    await strategy.validate(
      {
        query: { state: 'web.n1' },
        cookies: { g_oauth_state: 'n1' },
      } as unknown as Request,
      'at',
      'rt',
      profile,
      done,
    );

    expect(authService.validateGoogleUser).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, {
      id: 'u-1',
      oauthState: 'web.n1',
    });
  });
});
