import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 通知查詢方法
  // ========================================

  /**
   * 取得管理員通知列表（包含系統通知和個人通知）
   */
  async findAllForAdmin(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const { limit = 50, offset = 0, unreadOnly = false } = options || {};

    const where: Prisma.NotificationWhereInput = {
      // 管理員可看到所有系統通知（userId 為 null）
      userId: null,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * 取得未讀通知數量
   */
  async getUnreadCount() {
    return this.prisma.notification.count({
      where: {
        userId: null,
        isRead: false,
      },
    });
  }

  /**
   * 取得單一通知
   */
  async findOne(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  // ========================================
  // 通知操作方法
  // ========================================

  /**
   * 建立通知
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.JsonObject | undefined,
        userId: dto.userId,
      },
    });
  }

  /**
   * 標記單一通知為已讀
   */
  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * 標記所有通知為已讀
   */
  async markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: {
        userId: null,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * 刪除通知
   */
  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // ========================================
  // 通知建立輔助方法
  // ========================================

  /**
   * 建立新訂單通知
   */
  async createNewOrderNotification(order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    userName: string;
  }) {
    return this.create({
      type: NotificationType.NEW_ORDER,
      title: '新訂單通知',
      message: `收到來自 ${order.userName} 的新訂單 #${order.orderNumber}，金額 NT$${order.totalAmount.toLocaleString()}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
    });
  }

  /**
   * 建立訂單取消通知
   */
  async createOrderCancelledNotification(order: {
    id: string;
    orderNumber: string;
    reason?: string;
  }) {
    return this.create({
      type: NotificationType.ORDER_CANCELLED,
      title: '訂單已取消',
      message: `訂單 #${order.orderNumber} 已被取消${order.reason ? `，原因：${order.reason}` : ''}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: order.reason,
      },
    });
  }

  /**
   * 建立付款成功通知
   */
  async createPaymentSuccessNotification(order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  }) {
    return this.create({
      type: NotificationType.PAYMENT_SUCCESS,
      title: '付款成功',
      message: `訂單 #${order.orderNumber} 已完成付款，金額 NT$${order.totalAmount.toLocaleString()}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
    });
  }

  /**
   * 建立庫存預警通知
   */
  async createLowStockNotification(product: {
    id: string;
    name: string;
    stock: number;
    threshold: number;
  }) {
    return this.create({
      type: NotificationType.LOW_STOCK,
      title: '庫存預警',
      message: `產品「${product.name}」庫存不足，目前庫存 ${product.stock}，低於警戒線 ${product.threshold}`,
      data: {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        threshold: product.threshold,
      },
    });
  }

  // ========================================
  // 庫存預警設定
  // ========================================

  /**
   * 取得庫存預警設定列表
   */
  async getStockAlertSettings() {
    return this.prisma.stockAlertSetting.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 更新庫存預警設定
   */
  async upsertStockAlertSetting(
    productId: string,
    data: { threshold?: number; isEnabled?: boolean },
  ) {
    return this.prisma.stockAlertSetting.upsert({
      where: { productId },
      create: {
        productId,
        threshold: data.threshold ?? 10,
        isEnabled: data.isEnabled ?? true,
      },
      update: {
        threshold: data.threshold,
        isEnabled: data.isEnabled,
      },
    });
  }

  /**
   * 檢查並建立庫存預警
   * 用於產品庫存更新後呼叫
   */
  async checkAndCreateStockAlert(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { stockAlertSetting: true },
    });

    if (!product) return null;

    // 如果沒有設定或已停用，不檢查
    const setting = product.stockAlertSetting;
    if (!setting || !setting.isEnabled) return null;

    // 如果庫存高於警戒線，不需要警報
    if (product.stock >= setting.threshold) return null;

    // 檢查最近24小時內是否已發送過相同產品的庫存警報
    const recentAlert = await this.prisma.notification.findFirst({
      where: {
        type: NotificationType.LOW_STOCK,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        data: {
          path: ['productId'],
          equals: productId,
        },
      },
    });

    // 如果已有警報，不重複發送
    if (recentAlert) return null;

    // 建立庫存預警
    return this.createLowStockNotification({
      id: product.id,
      name: product.name,
      stock: product.stock,
      threshold: setting.threshold,
    });
  }
}
