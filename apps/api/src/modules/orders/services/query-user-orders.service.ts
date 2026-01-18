import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 使用者訂單查詢服務
 * 負責處理使用者端的訂單查詢操作
 */
@Injectable()
export class QueryUserOrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得使用者的訂單列表
   */
  async getUserOrders(userId: string, limit = 20, offset = 0) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

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
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在或無權限查看');
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
