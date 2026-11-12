import { resolveGoogleAuthOptions } from './google.strategy';

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
