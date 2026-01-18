import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 訂單統計服務
 * 負責處理基礎訂單統計數據
 */
@Injectable()
export class OrderStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得訂單統計
   */
  async getOrderStats() {
    const [totalOrders, totalAmountResult, statusCounts] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const countByStatus = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalOrders,
      totalAmount: totalAmountResult._sum.totalAmount || 0,
      pendingOrders: countByStatus['pending'] || 0,
      confirmedOrders: countByStatus['confirmed'] || 0,
      processingOrders: countByStatus['processing'] || 0,
      shippedOrders: countByStatus['shipped'] || 0,
      deliveredOrders: countByStatus['delivered'] || 0,
      cancelledOrders: countByStatus['cancelled'] || 0,
    };
  }
}
