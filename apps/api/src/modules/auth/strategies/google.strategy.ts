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

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
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
  }

  /**
   * 動態生成 OAuth state，包含 redirect 參數
   * 這會在重導向到 Google 前被調用
   */
  authenticate(req: Request, options?: object) {
    const redirect = req.query.redirect as string;
    const state = redirect === 'admin' ? 'admin' : 'web';
    super.authenticate(req, { ...options, state });
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
