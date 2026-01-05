import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '@/modules/auth/strategies/jwt.strategy';

/**
 * 當前用戶資料裝飾器
 *
 * 從 JWT 認證後的 request.user 中提取用戶資訊
 *
 * @example
 * // 取得整個用戶物件
 * @CurrentUser() user: JwtUser
 *
 * // 只取得 userId
 * @CurrentUser('userId') userId: string
 *
 * // 只取得 email
 * @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;

    // 如果指定了欄位，回傳該欄位的值
    if (data) {
      return user?.[data];
    }

    // 否則回傳整個用戶物件
    return user;
  },
);
