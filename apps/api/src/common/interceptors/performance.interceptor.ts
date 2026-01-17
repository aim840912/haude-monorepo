import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * API 請求效能追蹤 Interceptor
 *
 * 監控每個 API 請求的執行時間，並記錄慢請求警告。
 * - 開發環境：記錄所有請求的執行時間
 * - 生產環境：僅記錄超過閾值的慢請求
 *
 * 閾值：500ms（可透過環境變數調整）
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly SLOW_REQUEST_THRESHOLD = parseInt(
    process.env.SLOW_REQUEST_THRESHOLD || '500',
    10,
  );

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          this.logger.warn(`Slow Request: ${method} ${url} - ${duration}ms`);
        } else if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`${method} ${url} - ${duration}ms`);
        }
      }),
    );
  }
}
