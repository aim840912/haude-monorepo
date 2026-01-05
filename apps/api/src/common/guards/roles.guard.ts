import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtUser } from '@/modules/auth/strategies/jwt.strategy';

interface RequestWithUser {
  user?: JwtUser;
}

/**
 * 角色驗證 Guard
 * 檢查當前用戶是否具有所需角色
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * async adminEndpoint() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 從裝飾器取得所需角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果沒有設定角色要求，允許通過
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 從請求中取得用戶資訊（由 JwtAuthGuard 注入）
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    // 檢查用戶角色是否符合要求
    return requiredRoles.includes(user.role);
  }
}
