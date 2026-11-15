import { randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  /** Google's own email_verified claim; required before linking or creating by email. */
  emailVerified: boolean;
}

type GoogleTarget = 'web' | 'admin';

/**
 * Login-CSRF guard. The authorization request stores a random nonce in this
 * cookie and sends `state = "<target>.<nonce>"`; the callback only signs in when
 * the two match. Without it, an attacker can complete their own Google sign-in
 * in a victim's browser and the victim ends up in the attacker's account.
 *
 * SameSite=Lax still reaches the callback: Google returns via a top-level GET.
 * The path covers both /auth/google and /auth/google/callback, on whichever
 * origin the browser uses (web / admin proxy, or the API directly in dev).
 */
export const OAUTH_STATE_COOKIE = 'g_oauth_state';
export const OAUTH_STATE_COOKIE_PATH = '/api/v1/auth/google';
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

/** Split `"<target>.<nonce>"`; anything but "admin" is treated as web. */
export function parseOAuthState(raw: unknown): {
  target: GoogleTarget;
  nonce?: string;
} {
  if (typeof raw !== 'string') return { target: 'web', nonce: undefined };
  const dot = raw.indexOf('.');
  const prefix = dot === -1 ? raw : raw.slice(0, dot);
  const nonce = dot === -1 ? undefined : raw.slice(dot + 1);
  return { target: prefix === 'admin' ? 'admin' : 'web', nonce };
}

/** Constant-time comparison of the state nonce against the cookie value. */
export function isValidOAuthNonce(
  nonce: string | undefined,
  cookieNonce: string | undefined,
): boolean {
  if (!nonce || !cookieNonce) return false;
  const a = Buffer.from(nonce);
  const b = Buffer.from(cookieNonce);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Decide which app this OAuth round-trip belongs to and which callback URL
 * Google must redirect back to.
 *
 * Web and admin each get their own callback (GOOGLE_WEB_CALLBACK_URL /
 * GOOGLE_ADMIN_CALLBACK_URL) pointing at their own origin, which proxies
 * /api/v1/* to this API. The auth cookies are then set on that origin as
 * first-party cookies; set on onrender.com they are third-party to vercel.app
 * and get dropped by Safari and Chrome incognito.
 *
 * The callback phase (Google returns ?code=&state=) must send the same
 * redirect_uri in the token exchange as the authorization request, so the
 * target is re-derived from `state` there instead of from `redirect`.
 *
 * Admin sign-in always shows Google's account chooser: logging out of admin
 * does not sign the browser out of Google, so Google would otherwise silently
 * reuse the last account and a second admin on the same machine could never
 * switch in. Web customers keep one-click sign-in.
 */
export function resolveGoogleAuthOptions(
  query: Record<string, unknown>,
  callbackURLs: Partial<Record<GoogleTarget, string>>,
  nonce?: string,
): { state: string; callbackURL?: string; prompt?: 'select_account' } {
  // Google comes back with either ?code= or ?error= (e.g. access_denied); both
  // carry the state we sent, and neither carries `redirect`.
  const isCallback = Boolean(query.code || query.error);
  const target: GoogleTarget = isCallback
    ? parseOAuthState(query.state).target
    : query.redirect === 'admin'
      ? 'admin'
      : 'web';

  const callbackURL = callbackURLs[target];
  return {
    // Authorization: carry the CSRF nonce. Callback: passport ignores `state`;
    // the nonce is checked in the controller against the cookie.
    state: !isCallback && nonce ? `${target}.${nonce}` : target,
    ...(callbackURL && { callbackURL }),
    // prompt only shapes the authorization URL; the token exchange ignores it
    ...(target === 'admin' && !isCallback && { prompt: 'select_account' }),
  };
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly callbackURLs: Partial<Record<GoogleTarget, string>>;
  private readonly isProd: boolean;

  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    // passReqToCallback: true 讓 validate() 的第一個參數是 Request
    const options: StrategyOptionsWithRequest = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    };
    super(options);
    this.isProd = configService.get('NODE_ENV') === 'production';
    // Unset → that app keeps using GOOGLE_CALLBACK_URL (the pre-proxy behaviour)
    this.callbackURLs = {
      web: configService.get<string>('GOOGLE_WEB_CALLBACK_URL') || undefined,
      admin:
        configService.get<string>('GOOGLE_ADMIN_CALLBACK_URL') || undefined,
    };
  }

  /**
   * 動態生成 OAuth state（web / admin），並換成各自網域走代理的 callback
   * 授權請求與 callback 兩個階段都會經過這裡
   */
  authenticate(req: Request, options?: object) {
    const isCallback = Boolean(req.query.code || req.query.error);
    let nonce: string | undefined;

    if (!isCallback) {
      nonce = randomBytes(16).toString('base64url');
      req.res?.cookie(OAUTH_STATE_COOKIE, nonce, {
        httpOnly: true,
        secure: this.isProd,
        sameSite: 'lax',
        path: OAUTH_STATE_COOKIE_PATH,
        maxAge: OAUTH_STATE_MAX_AGE_MS,
      });
    }

    super.authenticate(req, {
      ...options,
      ...resolveGoogleAuthOptions(req.query, this.callbackURLs, nonce),
    });
  }

  /**
   * 當 passReqToCallback: true 時，第一個參數是 request
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const googleProfile: GoogleProfile = {
      googleId: id,
      email: emails?.[0]?.value || '',
      name: displayName || '',
      avatar: photos?.[0]?.value,
      // v3/userinfo (the strategy default) returns a boolean; older Google
      // endpoints returned the string "true". Accept both, nothing else.
      emailVerified: ['true', true].includes(
        (profile._json as { email_verified?: boolean | string } | undefined)
          ?.email_verified as boolean | string,
      ),
    };

    // 使用 AuthService 處理 Google 用戶驗證
    const user = await this.authService.validateGoogleUser(googleProfile);

    // 將 state 附加到 user 物件，供 callback 使用
    const state = req.query.state as string;
    done(null, { ...user, oauthState: state });
  }
}
