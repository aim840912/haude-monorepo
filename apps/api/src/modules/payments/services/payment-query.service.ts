import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

/**
 * 付款查詢服務
 *
 * 負責：
 * - 查詢訂單的付款狀態
 */
@Injectable()
export class PaymentQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查詢訂單的付款狀態
   */
  async getPaymentStatus(
    orderId: string,
    userId: string,
  ): Promise<{
    status: PaymentStatus;
    payTime?: Date;
    tradeNo?: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: payment?.status || order.paymentStatus,
      payTime: payment?.payTime ?? undefined,
      tradeNo: payment?.tradeNo ?? undefined,
    };
  }
}
