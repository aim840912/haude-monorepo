import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
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
   * 供部署驗證使用（確認服務已完全就緒）
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — includes DB connectivity check' })
  async ready() {
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
      // Log error server-side only — never expose DB details to clients
      console.error(
        'Readiness check DB error:',
        error instanceof Error ? error.message : error,
      );
    }

    return health;
  }
}
