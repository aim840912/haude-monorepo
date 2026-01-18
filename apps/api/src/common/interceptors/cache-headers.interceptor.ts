import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { CACHE_MAX_AGE_KEY } from '../decorators/cacheable.decorator';

/**
 * HTTP 快取標頭攔截器
 *
 * 自動為 GET 請求設置 Cache-Control 標頭。
 * - GET 請求：預設 5 分鐘公開快取（可透過 @Cacheable 覆寫）
 * - 其他請求：no-store（不快取）
 *
 * 快取策略：
 * - public：允許 CDN 和瀏覽器快取
 * - max-age：瀏覽器快取時間
 * - s-maxage：CDN/代理伺服器快取時間（可設為較長）
 * - stale-while-revalidate：背景更新時仍可使用舊快取
 */
@Injectable()
export class CacheHeadersInterceptor implements NestInterceptor {
  // GET 請求預設快取時間（秒）
  private readonly DEFAULT_MAX_AGE = 300; // 5 分鐘

  // stale-while-revalidate 時間（秒）
  private readonly STALE_WHILE_REVALIDATE = 60; // 1 分鐘

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 非 GET 請求不快取
    if (request.method !== 'GET') {
      return next.handle().pipe(
        tap(() => {
          response.setHeader('Cache-Control', 'no-store');
        }),
      );
    }

    // 從裝飾器取得自訂快取時間（如有）
    const customMaxAge = this.reflector.get<number>(
      CACHE_MAX_AGE_KEY,
      context.getHandler(),
    );

    // 決定最終快取時間
    const maxAge = customMaxAge ?? this.DEFAULT_MAX_AGE;

    return next.handle().pipe(
      tap(() => {
        if (maxAge === 0) {
          // 明確禁用快取
          response.setHeader('Cache-Control', 'no-store');
        } else {
          // 設置快取標頭
          // - public: 允許共享快取（CDN）
          // - max-age: 瀏覽器快取時間
          // - s-maxage: CDN 快取時間（設為 max-age 的兩倍）
          // - stale-while-revalidate: 背景重新驗證時仍返回舊資料
          const sMaxAge = maxAge * 2;
          response.setHeader(
            'Cache-Control',
            `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${this.STALE_WHILE_REVALIDATE}`,
          );
        }
      }),
    );
  }
}
