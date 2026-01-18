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
import { MembersService } from '../members/members.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private discountsService: DiscountsService,
    private emailService: EmailService,
    private membersService: MembersService,
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
  // 儀表板統計方法
  // ========================================

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

    // 2. 取得產品資訊並驗證庫存（提前失敗機制）
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    const productNameMap = new Map<string, string>(); // 用於錯誤訊息
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

      // 提前檢查庫存（非原子操作，僅作為提前失敗機制）
      const availableStock = product.stock - product.reservedStock;
      if (availableStock < item.quantity) {
        throw new BadRequestException(`產品庫存不足: ${product.name}`);
      }

      // 儲存產品名稱用於交易內的錯誤訊息
      productNameMap.set(item.productId, product.name);

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

    // 3. 取得會員等級資訊
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { memberLevel: true },
    });

    const memberLevelConfig = user?.memberLevel
      ? await this.membersService.getLevelConfig(user.memberLevel)
      : null;

    // 4. 計算運費（金卡會員免運）
    let shippingFee = OrderCalculator.calculateShippingFee(
      subtotal,
      dto.shippingAddress.city,
    );

    // 金卡會員免運費
    if (memberLevelConfig?.freeShipping) {
      shippingFee = 0;
    }

    const tax = OrderCalculator.calculateTax(subtotal);

    // 5. 計算會員折扣
    const memberDiscountPercent = memberLevelConfig?.discountPercent || 0;
    const memberDiscount = Math.floor((subtotal * memberDiscountPercent) / 100);

    // 6. 驗證和計算促銷折扣（如果有提供折扣碼）
    let promoDiscountAmount = 0;
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

      promoDiscountAmount = discountResult.discountAmount || 0;
      discountCode = discountResult.code || null;
    }

    // 7. 取較高的折扣（會員折扣 vs 促銷折扣）
    const discountAmount = Math.max(memberDiscount, promoDiscountAmount);

    // 如果使用會員折扣且沒有使用促銷碼，清除 discountCode
    if (memberDiscount > promoDiscountAmount) {
      discountCode = null;
    }

    // 8. 計算總額（扣除折扣）
    const totalAmount =
      OrderCalculator.calculateTotal(subtotal, shippingFee, tax) -
      discountAmount;

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

      // 扣減庫存（原子操作，包含庫存檢查防止競態條件）
      for (const item of dto.items) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }, // 條件：庫存 >= 購買數量
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // 如果沒有更新任何記錄，表示庫存不足（被其他交易搶先扣減）
        if (updateResult.count === 0) {
          throw new BadRequestException(
            `產品庫存不足: ${productNameMap.get(item.productId)}`,
          );
        }
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
    order: {
      orderNumber: string;
      subtotal: number;
      shippingFee: number;
      discountAmount: number;
      totalAmount: number;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number | bigint | Prisma.Decimal;
        subtotal: number | bigint | Prisma.Decimal;
      }>;
    },
    dto: CreateOrderDto,
  ) {
    try {
      // 取得使用者資訊
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        this.logger.warn(
          `無法發送訂單確認郵件：找不到使用者 ${userId} 的 email`,
        );
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
    if (
      dto.status === 'shipped' &&
      (dto.trackingNumber || order.trackingNumber)
    ) {
      const trackingNumber = dto.trackingNumber || order.trackingNumber || '';
      this.sendShippingNotificationEmailAsync(
        order.user.email,
        order.orderNumber,
        trackingNumber,
        order.user.name,
      );
    }

    // 當訂單狀態變更為 delivered（已送達）時，更新會員累積消費並發放積分
    if (dto.status === 'delivered' && order.status !== 'delivered') {
      this.processOrderCompletionAsync(
        order.userId,
        order.id,
        order.totalAmount,
      );
    }

    return updatedOrder;
  }

  /**
   * 非同步處理訂單完成後的會員系統更新
   * - 更新累積消費並檢查升級
   * - 發放積分
   */
  private async processOrderCompletionAsync(
    userId: string,
    orderId: string,
    orderAmount: number,
  ) {
    try {
      // 1. 更新累積消費並檢查升級
      const { upgraded } =
        await this.membersService.updateTotalSpentAndCheckUpgrade(
          userId,
          orderAmount,
        );

      if (upgraded) {
        this.logger.log(`會員 ${userId} 已升級`);
      }

      // 2. 發放積分
      const earnedPoints = await this.membersService.addPointsForPurchase(
        userId,
        orderAmount,
        orderId,
      );

      this.logger.log(`會員 ${userId} 獲得 ${earnedPoints} 積分`);
    } catch (error) {
      // 會員系統更新失敗不應影響訂單狀態更新
      this.logger.error(`處理訂單完成會員更新失敗: ${error}`);
    }
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
