import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 儀表板分析服務
 * 負責處理複雜的營收趨勢、狀態分布、熱銷產品等分析數據
 */
@Injectable()
export class DashboardAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得營收趨勢數據
   * @param period 時間區間：day（7天）、week（4週）、month（6個月）
   */
  async getRevenueTrend(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        groupByFormat = 'day';
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 28);
        groupByFormat = 'week';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        groupByFormat = 'month';
        break;
    }

    // 取得指定期間的訂單
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['cancelled', 'refunded'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // 按日期分組計算營收
    const revenueMap = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order) => {
      let key: string;
      const date = new Date(order.createdAt);

      if (groupByFormat === 'day') {
        key = date.toISOString().slice(0, 10);
      } else if (groupByFormat === 'week') {
        // 取得該週的週一日期
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      const existing = revenueMap.get(key) || { revenue: 0, orders: 0 };
      revenueMap.set(key, {
        revenue: existing.revenue + (order.totalAmount || 0),
        orders: existing.orders + 1,
      });
    });

    // 轉換為陣列並排序
    const result = Array.from(revenueMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  /**
   * 取得訂單狀態分布（用於圓餅圖）
   */
  async getOrderStatusDistribution() {
    const statusLabels: Record<string, string> = {
      pending: '待處理',
      confirmed: '已確認',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      cancelled: '已取消',
      refunded: '已退款',
    };

    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.status,
      label: statusLabels[item.status] || item.status,
    }));
  }

  /**
   * 取得熱銷產品排行
   * @param limit 返回數量限制
   */
  async getTopProducts(limit = 10) {
    // 聚合訂單項目，計算每個產品的銷量
    const productSales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // 取得產品名稱
    const productIds = productSales.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p.name]));

    return productSales.map((item) => ({
      id: item.productId,
      name: productMap.get(item.productId) || '未知產品',
      sales: item._sum.quantity || 0,
      revenue: item._sum.subtotal || 0,
    }));
  }
}
