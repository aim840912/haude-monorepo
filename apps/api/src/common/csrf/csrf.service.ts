import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { CookieOptions } from 'express';

@Injectable()
export class CsrfService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 生成 CSRF Token
   * 使用 crypto.randomBytes 確保密碼學安全的隨機性
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 取得 CSRF Cookie 設定
   * 生產環境使用 secure: true 和 sameSite: 'strict'
   */
  getCookieOptions(): CookieOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      httpOnly: false, // 前端需要讀取 Cookie 值
      secure: isProduction, // 生產環境僅 HTTPS
      sameSite: isProduction ? 'strict' : 'lax', // 防止跨站請求
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    };
  }

  /**
   * 驗證 CSRF Token
   * 使用 timingSafeEqual 防止計時攻擊
   */
  validateToken(cookieToken: string, headerToken: string): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    try {
      const cookieBuffer = Buffer.from(cookieToken);
      const headerBuffer = Buffer.from(headerToken);

      if (cookieBuffer.length !== headerBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(cookieBuffer, headerBuffer);
    } catch {
      return false;
    }
  }
}
