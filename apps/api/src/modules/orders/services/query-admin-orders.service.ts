import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 管理員訂單查詢服務
 * 負責處理管理員端的訂單查詢操作
 */
@Injectable()
export class QueryAdminOrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得單一訂單詳情（管理員，不驗證 userId）
   */
  async getOrderByIdForAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      throw new NotFoundException('訂單不存在');
    }

    // 將最新的 payment 資訊攤平，並加入用戶資訊
    const latestPayment = order.payments?.[0];
    return {
      ...order,
      userName: order.user?.name,
      userEmail: order.user?.email,
      payment: latestPayment || null,
      payments: undefined,
      user: undefined,
    };
  }

  /**
   * 取得所有訂單（管理員）
   * @param filters 可選日期篩選，用於匯出等場景
   */
  async getAllOrders(
    limit = 20,
    offset = 0,
    filters?: { startDate?: string; endDate?: string },
  ) {
    // Build date filter for createdAt
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        ...order,
        userName: order.user?.name,
        userEmail: order.user?.email,
      })),
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    };
  }
}
