import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 選擇性 JWT 驗證 Guard
 *
 * 與 JwtAuthGuard 不同：未帶 token 或 token 無效時「不會」拋出 401，
 * 請求仍會放行，只是 `req.user` 會是 undefined。
 *
 * 用途：公開端點想要「如果有登入，順便知道是誰／什麼角色」時使用
 * （例如依角色決定要不要回傳完整內容），但不應強制要求登入。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    // 忽略驗證錯誤（無 token / token 過期 / 使用者不存在等），一律放行
    return user;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      // Passport 驗證失敗時仍放行（handleRequest 已經處理過 user 為 undefined 的情況，
      // 這裡是保險：避免任何非預期的同步/非同步錯誤中斷公開端點）
      return true;
    }
  }
}
