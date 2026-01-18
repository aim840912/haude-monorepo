import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CsrfService } from '../csrf/csrf.service';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfService: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 檢查是否標記為跳過 CSRF 驗證
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // GET、HEAD、OPTIONS 等安全方法不需要 CSRF 驗證
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(method)) {
      return true;
    }

    // 從 Cookie 和 Header 取得 CSRF Token
    const cookieToken =
      (request.cookies as Record<string, string> | undefined)?.['csrf-token'] ??
      '';
    const headerToken = request.headers['x-csrf-token'] as string;

    // 驗證 Token
    if (!this.csrfService.validateToken(cookieToken, headerToken)) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      });
    }

    return true;
  }
}
