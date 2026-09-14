import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';

@SkipThrottle() // 健康檢查不受速率限制
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness probe — 純 CPU 回應，不查 DB
   * 供 cron-job.org keep-alive 和 Docker HEALTHCHECK 使用
   * 冷啟動後立即可回應（毫秒級）
   */
  @Get()
  @ApiOperation({ summary: 'Liveness probe — instant response, no DB check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness probe — 含 DB SELECT 1 查詢
   * 供 cron-job.org keep-alive（同時讓 Supabase 保持活躍）與部署驗證使用
   *
   * DB 斷線回 503：讓外部監控能以狀態碼判斷故障並發出通知。
   * 用 passthrough 設狀態碼而非 throw，保留 `database` 欄位且不經 exception filter。
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — includes DB connectivity check' })
  @ApiResponse({ status: 200, description: 'Database connected' })
  @ApiResponse({ status: 503, description: 'Database disconnected' })
  async ready(@Res({ passthrough: true }) res: Response) {
    const health: Record<string, unknown> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.status = 'degraded';
      health.database = 'disconnected';
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      // Log error server-side only — never expose DB details to clients
      console.error(
        'Readiness check DB error:',
        error instanceof Error ? error.message : error,
      );
    }

    return health;
  }
}
