import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface PeriodStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  cancelRate: number;
}

export interface SalesTrendItem {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface SalesDetailItem {
  date: string;
  orderNumber: string;
  customerName: string;
  productCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得銷售摘要（含同比環比）
   */
  async getSalesSummary(
    startDate: Date,
    endDate: Date,
    compareMode?: 'yoy' | 'mom' | 'wow',
  ) {
    // 當期數據
    const current = await this.getPeriodStats(startDate, endDate);

    // 如果有對比模式，計算對比期數據
    let compare: PeriodStats | null = null;
    let changes: Record<string, number> | null = null;

    if (compareMode) {
      const { compareStart, compareEnd } = this.getComparePeriod(
        startDate,
        endDate,
        compareMode,
      );
      compare = await this.getPeriodStats(compareStart, compareEnd);
      changes = this.calculateChanges(current, compare);
    }

    return {
      current,
      compare,
      changes,
      period: {
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
      },
    };
  }

  /**
   * 取得指定期間的統計數據
   */
  private async getPeriodStats(
    startDate: Date,
    endDate: Date,
  ): Promise<PeriodStats> {
    const [orderStats, cancelledCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: ['cancelled', 'refunded'] },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'cancelled',
        },
      }),
    ]);

    const totalOrders = orderStats._count.id;
    const totalRevenue = orderStats._sum.totalAmount || 0;
    const totalOrdersWithCancelled = totalOrders + cancelledCount;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      cancelRate:
        totalOrdersWithCancelled > 0
          ? Math.round((cancelledCount / totalOrdersWithCancelled) * 100 * 100) / 100
          : 0,
    };
  }

  /**
   * 計算對比期間
   */
  private getComparePeriod(
    startDate: Date,
    endDate: Date,
    mode: 'yoy' | 'mom' | 'wow',
  ) {
    const duration = endDate.getTime() - startDate.getTime();
    let compareStart: Date;
    let compareEnd: Date;

    switch (mode) {
      case 'yoy': // 年同比
        compareStart = new Date(startDate);
        compareStart.setFullYear(compareStart.getFullYear() - 1);
        compareEnd = new Date(endDate);
        compareEnd.setFullYear(compareEnd.getFullYear() - 1);
        break;
      case 'mom': // 月環比
        compareStart = new Date(startDate);
        compareStart.setMonth(compareStart.getMonth() - 1);
        compareEnd = new Date(endDate);
        compareEnd.setMonth(compareEnd.getMonth() - 1);
        break;
      case 'wow': // 週環比（前一個同等長度期間）
        compareEnd = new Date(startDate.getTime() - 1);
        compareStart = new Date(compareEnd.getTime() - duration);
        break;
    }

    return { compareStart, compareEnd };
  }

  /**
   * 計算變化百分比
   */
  private calculateChanges(
    current: PeriodStats,
    compare: PeriodStats,
  ): Record<string, number> {
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100 * 100) / 100;
    };

    return {
      revenueChange: calcChange(current.totalRevenue, compare.totalRevenue),
      ordersChange: calcChange(current.totalOrders, compare.totalOrders),
      aovChange: calcChange(current.averageOrderValue, compare.averageOrderValue),
      cancelRateChange: calcChange(current.cancelRate, compare.cancelRate),
    };
  }

  /**
   * 取得銷售趨勢（自訂日期範圍）
   */
  async getSalesTrend(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<SalesTrendItem[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { notIn: ['cancelled', 'refunded'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // 按日期分組
    const revenueMap = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order) => {
      const key = this.getDateKey(order.createdAt, groupBy);
      const existing = revenueMap.get(key) || { revenue: 0, orders: 0 };
      revenueMap.set(key, {
        revenue: existing.revenue + (order.totalAmount || 0),
        orders: existing.orders + 1,
      });
    });

    // 轉換為陣列並計算平均客單價
    return Array.from(revenueMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        averageOrderValue: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 根據分組方式取得日期 key
   */
  private getDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);

    switch (groupBy) {
      case 'day':
        return d.toISOString().slice(0, 10);
      case 'week': {
        // 取得該週的週一
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        return monday.toISOString().slice(0, 10);
      }
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
  }

  /**
   * 取得銷售明細（分頁）
   */
  async getSalesDetail(
    startDate: Date,
    endDate: Date,
    limit = 20,
    offset = 0,
  ): Promise<{ items: SalesDetailItem[]; total: number; hasMore: boolean }> {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          user: { select: { name: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const items: SalesDetailItem[] = orders.map((order) => ({
      date: order.createdAt.toISOString().slice(0, 10),
      orderNumber: order.orderNumber,
      customerName: order.user?.name || '訪客',
      productCount: order.items.length,
      subtotal: order.subtotal,
      discount: order.discountAmount,
      shipping: order.shippingFee,
      total: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
    }));

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }
}
