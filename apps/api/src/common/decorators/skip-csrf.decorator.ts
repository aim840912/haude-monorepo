import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * 跳過 CSRF 驗證的裝飾器
 * 用於標記不需要 CSRF 驗證的端點（如：登入、註冊、Webhook）
 *
 * @example
 * @SkipCsrf()
 * @Post('login')
 * async login() { ... }
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
