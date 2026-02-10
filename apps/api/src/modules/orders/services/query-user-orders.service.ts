import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderExpiryService } from './order-expiry.service';

/**
 * 使用者訂單查詢服務
 * 負責處理使用者端的訂單查詢操作
 */
@Injectable()
export class QueryUserOrdersService {
  constructor(
    private prisma: PrismaService,
    private orderExpiryService: OrderExpiryService,
  ) {}

  /**
   * 取得使用者的訂單列表
   * 包含懶檢查：自動標記過期的 pending 訂單
   */
  async getUserOrders(userId: string, limit = 20, offset = 0) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          payments: {
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    // 懶檢查：處理過期的 pending 訂單
    for (const order of orders) {
      if (order.status === 'pending' && order.paymentStatus === 'pending') {
        const payment = order.payments[0] ?? null;
        const expired = await this.orderExpiryService.checkAndExpireOrder(
          order.id,
          order.createdAt,
          order.status,
          order.paymentStatus,
          order.items,
          payment
            ? { ...payment, createdAt: payment.createdAt ?? order.createdAt }
            : null,
        );
        if (expired) {
          order.status = 'cancelled';
          order.paymentStatus = 'expired';
        }
      }
      // 清除查詢中附帶的 payments（原始回傳不含此欄位）
      delete (order as Record<string, unknown>).payments;
    }

    return {
      orders,
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    };
  }

  /**
   * 取得單一訂單（驗證權限）
   * 包含懶檢查：自動標記過期的 pending 訂單
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            status: true,
            paymentType: true,
            bankCode: true,
            vaAccount: true,
            paymentCode: true,
            expireDate: true,
            payTime: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在或無權限查看');
    }

    // 懶檢查：處理過期的 pending 訂單
    if (order.status === 'pending' && order.paymentStatus === 'pending') {
      const latestPayment = order.payments?.[0] ?? null;
      const expired = await this.orderExpiryService.checkAndExpireOrder(
        order.id,
        order.createdAt,
        order.status,
        order.paymentStatus,
        order.items,
        latestPayment,
      );
      if (expired) {
        order.status = 'cancelled';
        order.paymentStatus = 'expired';
      }
    }

    // 將最新的 payment 資訊攤平到 order 物件
    const latestPayment = order.payments?.[0];
    return {
      ...order,
      payment: latestPayment || null,
      payments: undefined, // 移除 payments 陣列，只保留單一 payment
    };
  }
}
