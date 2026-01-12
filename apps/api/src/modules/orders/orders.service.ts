import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { OrderCalculator } from './utils/order-calculator';
import { DiscountsService } from '../discounts/discounts.service';
import { EmailService, OrderEmailData } from '../email/email.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private discountsService: DiscountsService,
    private emailService: EmailService,
  ) {}

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

    // 3. 計算運費
    const shippingFee = OrderCalculator.calculateShippingFee(
      subtotal,
      dto.shippingAddress.city,
    );
    const tax = OrderCalculator.calculateTax(subtotal);

    // 4. 驗證和計算折扣（如果有提供折扣碼）
    let discountAmount = 0;
    let discountCode: string | null = null;

    if (dto.discountCode) {
      const discountResult = await this.discountsService.validateDiscountCode(
        dto.discountCode,
        userId,
        subtotal,
      );

      if (!discountResult.valid) {
        throw new BadRequestException(discountResult.message || '折扣碼無效');
      }

      discountAmount = discountResult.discountAmount || 0;
      discountCode = discountResult.code || null;
    }

    // 5. 計算總額（扣除折扣）
    const totalAmount = OrderCalculator.calculateTotal(
      subtotal,
      shippingFee,
      tax,
    ) - discountAmount;

    // 6. 生成訂單編號
    const orderNumber = await this.generateOrderNumber();

    // 7. 使用交易建立訂單並扣減庫存
    const order = await this.prisma.$transaction(async (tx) => {
      // 建立訂單
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          user: { connect: { id: userId } },
          subtotal,
          shippingFee,
          tax,
          discountCode,
          discountAmount,
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

    // 8. 記錄折扣使用（在交易外，避免過長交易）
    if (discountCode && discountAmount > 0) {
      await this.discountsService.applyDiscount(
        discountCode,
        userId,
        order.id,
        discountAmount,
      );
    }

    // 9. 發送訂單確認郵件（非同步，不阻塞回應）
    this.sendOrderConfirmationEmailAsync(userId, order, dto);

    return order;
  }

  /**
   * 非同步發送訂單確認郵件
   */
  private async sendOrderConfirmationEmailAsync(
    userId: string,
    order: { orderNumber: string; subtotal: number; shippingFee: number; discountAmount: number; totalAmount: number; items: Array<{ productName: string; quantity: number; unitPrice: number | bigint | Prisma.Decimal; subtotal: number | bigint | Prisma.Decimal }> },
    dto: CreateOrderDto,
  ) {
    try {
      // 取得使用者資訊
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        this.logger.warn(`無法發送訂單確認郵件：找不到使用者 ${userId} 的 email`);
        return;
      }

      // 準備郵件資料
      const emailData: OrderEmailData = {
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discountAmount: order.discountAmount || undefined,
        totalAmount: order.totalAmount,
        shippingAddress: {
          name: dto.shippingAddress.name,
          phone: dto.shippingAddress.phone,
          address: `${dto.shippingAddress.postalCode} ${dto.shippingAddress.city}${dto.shippingAddress.street}`,
        },
        paymentMethod: dto.paymentMethod,
      };

      await this.emailService.sendOrderConfirmationEmail(
        user.email,
        emailData,
        user.name,
      );
    } catch (error) {
      // 郵件發送失敗不應影響訂單建立
      this.logger.error(`發送訂單確認郵件失敗: ${error}`);
    }
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
    // 確認訂單存在並取得使用者資訊
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.notes) updateData.notes = dto.notes;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    // 當訂單狀態變更為 shipped 且有物流追蹤號時，發送發貨通知郵件
    if (dto.status === 'shipped' && (dto.trackingNumber || order.trackingNumber)) {
      const trackingNumber = dto.trackingNumber || order.trackingNumber || '';
      this.sendShippingNotificationEmailAsync(
        order.user.email,
        order.orderNumber,
        trackingNumber,
        order.user.name,
      );
    }

    return updatedOrder;
  }

  /**
   * 非同步發送發貨通知郵件
   */
  private async sendShippingNotificationEmailAsync(
    email: string | null,
    orderNumber: string,
    trackingNumber: string,
    userName: string | null,
  ) {
    if (!email) {
      this.logger.warn(`無法發送發貨通知郵件：找不到 email`);
      return;
    }

    try {
      await this.emailService.sendShippingNotificationEmail(
        email,
        orderNumber,
        trackingNumber,
        userName || undefined,
      );
    } catch (error) {
      this.logger.error(`發送發貨通知郵件失敗: ${error}`);
    }
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
