import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { OrderCalculator } from './utils/order-calculator';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 使用者查詢方法
  // ========================================

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
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在或無權限查看');
    }

    return order;
  }

  // ========================================
  // 管理員查詢方法
  // ========================================

  /**
   * 取得所有訂單（管理員）
   */
  async getAllOrders(limit = 20, offset = 0) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
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
      this.prisma.order.count(),
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

  // ========================================
  // 建立訂單
  // ========================================

  /**
   * 建立訂單
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. 驗證訂單項目
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('訂單至少需要一個商品');
    }

    // 2. 取得產品資訊並驗證庫存
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
        include: {
          images: {
            take: 1,
            orderBy: { displayPosition: 'asc' },
          },
        },
      });

      if (!product) {
        throw new BadRequestException(`產品不存在: ${item.productId}`);
      }

      const availableStock = product.stock - product.reservedStock;
      if (availableStock < item.quantity) {
        throw new BadRequestException(`產品庫存不足: ${product.name}`);
      }

      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: { connect: { id: item.productId } },
        productName: product.name,
        productImage: product.images[0]?.storageUrl || null,
        quantity: item.quantity,
        unitPrice: product.price,
        priceUnit: product.priceUnit,
        subtotal: itemSubtotal,
      });
    }

    // 3. 計算運費和總額
    const shippingFee = OrderCalculator.calculateShippingFee(
      subtotal,
      dto.shippingAddress.city,
    );
    const tax = OrderCalculator.calculateTax(subtotal);
    const totalAmount = OrderCalculator.calculateTotal(
      subtotal,
      shippingFee,
      tax,
    );

    // 4. 生成訂單編號
    const orderNumber = await this.generateOrderNumber();

    // 5. 使用交易建立訂單並扣減庫存
    const order = await this.prisma.$transaction(async (tx) => {
      // 建立訂單
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          user: { connect: { id: userId } },
          subtotal,
          shippingFee,
          tax,
          totalAmount,
          shippingAddress: dto.shippingAddress as object,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // 扣減庫存
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return order;
  }

  // ========================================
  // 取消訂單
  // ========================================

  /**
   * 取消訂單（使用者）
   */
  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    // 1. 驗證訂單存在且屬於該使用者
    const order = await this.getOrderById(orderId, userId);

    // 2. 檢查訂單狀態
    const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('此訂單狀態無法取消');
    }

    // 3. 使用交易取消訂單並恢復庫存
    await this.prisma.$transaction(async (tx) => {
      // 更新訂單狀態
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          notes: dto.reason
            ? `${order.notes || ''}\n取消原因: ${dto.reason}`.trim()
            : order.notes,
        },
      });

      // 恢復庫存
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return { message: '訂單已取消' };
  }

  // ========================================
  // 管理員更新訂單
  // ========================================

  /**
   * 更新訂單狀態（管理員）
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    // 確認訂單存在
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.notes) updateData.notes = dto.notes;

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });
  }

  // ========================================
  // 工具方法
  // ========================================

  /**
   * 生成訂單編號
   * 格式: ORD-YYYYMMDD-XXX
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // 計算今天的訂單數量
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
}
