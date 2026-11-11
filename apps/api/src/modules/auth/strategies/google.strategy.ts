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
}

type GoogleTarget = 'web' | 'admin';

/**
 * Decide which app this OAuth round-trip belongs to and which callback URL
 * Google must redirect back to.
 *
 * Web gets its own callback (GOOGLE_WEB_CALLBACK_URL) that points at the web
 * origin, which proxies /api/v1/* to this API. The auth cookies are then set
 * on the web origin as first-party cookies; set on onrender.com they are
 * third-party to vercel.app and get dropped by Safari and Chrome incognito.
 *
 * The callback phase (Google returns ?code=&state=) must send the same
 * redirect_uri in the token exchange as the authorization request, so the
 * target is re-derived from `state` there instead of from `redirect`.
 */
export function resolveGoogleAuthOptions(
  query: Record<string, unknown>,
  webCallbackURL: string | undefined,
): { state: GoogleTarget; callbackURL?: string } {
  // Google comes back with either ?code= or ?error= (e.g. access_denied); both
  // carry the state we sent, and neither carries `redirect`.
  const isCallback = Boolean(query.code || query.error);
  const requested = isCallback ? query.state : query.redirect;
  const state: GoogleTarget = requested === 'admin' ? 'admin' : 'web';

  if (state === 'web' && webCallbackURL) {
    return { state, callbackURL: webCallbackURL };
  }
  return { state };
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly webCallbackURL: string | undefined;

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
    // Unset → web keeps using GOOGLE_CALLBACK_URL (the pre-proxy behaviour)
    this.webCallbackURL =
      configService.get<string>('GOOGLE_WEB_CALLBACK_URL') || undefined;
  }

  /**
   * 動態生成 OAuth state（web / admin），並為 web 換成走代理的 callback
   * 授權請求與 callback 兩個階段都會經過這裡
   */
  authenticate(req: Request, options?: object) {
    super.authenticate(req, {
      ...options,
      ...resolveGoogleAuthOptions(req.query, this.webCallbackURL),
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
    };

    // 使用 AuthService 處理 Google 用戶驗證
    const user = await this.authService.validateGoogleUser(googleProfile);

    // 將 state 附加到 user 物件，供 callback 使用
    const state = req.query.state as string;
    done(null, { ...user, oauthState: state });
  }
}
