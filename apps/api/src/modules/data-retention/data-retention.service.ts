import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 資料保留期限清理
 *
 * 個資法要求個人資料在特定目的消失後應予刪除。稽核 / 除錯性質的紀錄
 * （付款回調日誌、操作稽核日誌）留存過久沒有業務價值，卻擴大外洩時的
 * 影響範圍，因此設定保留期限並定期清除。
 *
 * 注意：這裡清的是「日誌」，不是交易本身。
 * Order / Payment 屬會計憑證性質，需另依商業會計法保存，不在此清理範圍。
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private days(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  private cutoff(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  /** 每日 03:00 執行 */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    try {
      const result = await this.runCleanup();
      this.logger.log(
        `資料保留清理完成: paymentLogs=${result.paymentLogs}, auditLogs=${result.auditLogs}, refreshTokens=${result.refreshTokens}`,
      );
    } catch (error) {
      // 清理失敗不應影響服務運作，記錄後由監控處理
      this.logger.error(
        `資料保留清理失敗: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 實際清理邏輯（與排程分離，方便測試與手動觸發）
   */
  async runCleanup(): Promise<{
    paymentLogs: number;
    auditLogs: number;
    refreshTokens: number;
  }> {
    const paymentLogDays = this.days('PAYMENT_LOG_RETENTION_DAYS', 180);
    const auditLogDays = this.days('AUDIT_LOG_RETENTION_DAYS', 365);

    const paymentLogs = await this.prisma.paymentLog.deleteMany({
      where: { createdAt: { lt: this.cutoff(paymentLogDays) } },
    });

    const auditLogs = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: this.cutoff(auditLogDays) } },
    });

    // 已過期 / 已撤銷超過 7 天的 refresh token
    const refreshTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null, lt: this.cutoff(7) } },
        ],
      },
    });

    return {
      paymentLogs: paymentLogs.count,
      auditLogs: auditLogs.count,
      refreshTokens: refreshTokens.count,
    };
  }
}
