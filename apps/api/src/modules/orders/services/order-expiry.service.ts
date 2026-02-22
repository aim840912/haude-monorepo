import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 訂單過期自動取消服務
 *
 * 雙重保障機制：
 * 1. @Cron 每小時主動掃描過期訂單（批量處理）
 * 2. checkAndExpireOrder() 懶檢查（查詢時即時判斷）
 *
 * 超時規則：
 * - ATM：Payment.expireDate 或 createdAt + 3 天
 * - CVS：Payment.expireDate 或 createdAt + 7 天
 * - CREDIT：Payment.createdAt + 30 分鐘
 * - 無付款記錄：Order.createdAt + 24 小時
 */
@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  /** 各付款方式的預設超時（毫秒） */
  private static readonly EXPIRY_MS = {
    ATM: 3 * 24 * 60 * 60 * 1000, // 3 天
    CVS: 7 * 24 * 60 * 60 * 1000, // 7 天
    CREDIT: 30 * 60 * 1000, // 30 分鐘
    DEFAULT: 24 * 60 * 60 * 1000, // 24 小時（無付款記錄）
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 每小時掃描並取消過期的 pending 訂單
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredOrders(): Promise<void> {
    this.logger.log('開始掃描過期訂單...');

    const pendingOrders = await this.prisma.order.findMany({
      where: { status: 'pending', paymentStatus: 'pending' },
      include: {
        items: true,
        payments: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let expiredCount = 0;

    for (const order of pendingOrders) {
      const payment = order.payments[0] ?? null;

      if (this.isExpired(order.createdAt, payment)) {
        try {
          await this.expireOrder(order.id, order.items, payment?.id);
          expiredCount++;
        } catch (error) {
          this.logger.error(
            `取消過期訂單失敗 [${order.orderNumber}]: ${error}`,
          );
        }
      }
    }

    this.logger.log(
      `掃描完成：共 ${pendingOrders.length} 筆待處理，${expiredCount} 筆已過期取消`,
    );
  }

  /**
   * 懶檢查：查詢時判斷單筆訂單是否過期
   *
   * @returns true 表示訂單已被標記為過期
   */
  async checkAndExpireOrder(
    orderId: string,
    orderCreatedAt: Date,
    orderStatus: string,
    paymentStatus: string,
    items: Array<{ productId: string; quantity: number }>,
    payment?: {
      id: string;
      status: string;
      paymentType: string;
      expireDate: Date | null;
      createdAt: Date;
    } | null,
  ): Promise<boolean> {
    // 只處理 pending 訂單
    if (orderStatus !== 'pending' || paymentStatus !== 'pending') {
      return false;
    }

    // 只檢查 pending 狀態的付款
    const pendingPayment =
      payment && payment.status === 'pending' ? payment : null;

    if (!this.isExpired(orderCreatedAt, pendingPayment)) {
      return false;
    }

    try {
      await this.expireOrder(orderId, items, pendingPayment?.id);
      return true;
    } catch (error) {
      this.logger.error(`懶檢查取消訂單失敗 [${orderId}]: ${error}`);
      return false;
    }
  }

  /**
   * 判斷是否已超過期限
   */
  private isExpired(
    orderCreatedAt: Date,
    payment: {
      paymentType: string;
      expireDate?: Date | null;
      createdAt: Date;
    } | null,
  ): boolean {
    const now = Date.now();

    if (!payment) {
      // 無付款記錄：以訂單建立時間 + 24 小時判定
      return (
        now > orderCreatedAt.getTime() + OrderExpiryService.EXPIRY_MS.DEFAULT
      );
    }

    // 優先使用 ECPay 回傳的 expireDate（ATM/CVS 取號後會設定）
    if (payment.expireDate) {
      return now > new Date(payment.expireDate).getTime();
    }

    // Fallback：根據付款方式使用預設超時
    const expiryMs =
      OrderExpiryService.EXPIRY_MS[
        payment.paymentType as keyof typeof OrderExpiryService.EXPIRY_MS
      ] ?? OrderExpiryService.EXPIRY_MS.DEFAULT;

    return now > payment.createdAt.getTime() + expiryMs;
  }

  /**
   * 在事務中取消過期訂單並恢復庫存
   */
  private async expireOrder(
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    paymentId?: string | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 更新訂單狀態
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          paymentStatus: 'expired',
          notes: '系統自動取消：付款超時',
        },
      });

      // 更新付款狀態
      if (paymentId) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'expired' },
        });
      }

      // 恢復庫存
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    this.logger.log(`訂單過期取消: ${orderId}`);
  }
}
