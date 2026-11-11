import { resolveGoogleAuthOptions } from './google.strategy';

const WEB_CALLBACK = 'https://haude-web.vercel.app/api/v1/auth/google/callback';

describe('resolveGoogleAuthOptions', () => {
  it('routes the web authorization request through the web callback', () => {
    expect(resolveGoogleAuthOptions({}, WEB_CALLBACK)).toEqual({
      state: 'web',
      callbackURL: WEB_CALLBACK,
    });
  });

  it('keeps admin on the default callback', () => {
    expect(
      resolveGoogleAuthOptions({ redirect: 'admin' }, WEB_CALLBACK),
    ).toEqual({ state: 'admin' });
  });

  it('re-derives the web callback from state when Google returns the code', () => {
    // Token exchange must send the same redirect_uri as the authorization step
    expect(
      resolveGoogleAuthOptions({ code: 'abc', state: 'web' }, WEB_CALLBACK),
    ).toEqual({ state: 'web', callbackURL: WEB_CALLBACK });
  });

  it('re-derives admin from state when Google returns the code', () => {
    expect(
      resolveGoogleAuthOptions({ code: 'abc', state: 'admin' }, WEB_CALLBACK),
    ).toEqual({ state: 'admin' });
  });

  it('falls back to the default callback when no web callback is configured', () => {
    expect(resolveGoogleAuthOptions({}, undefined)).toEqual({ state: 'web' });
  });
});
