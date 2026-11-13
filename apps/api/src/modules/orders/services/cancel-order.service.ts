import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CancelOrderDto } from '../dto';
import { QueryUserOrdersService } from './query-user-orders.service';
import { restoreOrderStock } from './order-stock';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * 訂單取消服務
 * 負責處理使用者端的訂單取消操作，包含狀態驗證和庫存恢復
 */
@Injectable()
export class CancelOrderService {
  private readonly logger = new Logger(CancelOrderService.name);

  constructor(
    private prisma: PrismaService,
    private queryUserOrdersService: QueryUserOrdersService,
    private notifications: NotificationsService,
  ) {}

  /**
   * 取消訂單（使用者）
   */
  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    // 1. 驗證訂單存在且屬於該使用者
    const order = await this.queryUserOrdersService.getOrderById(
      orderId,
      userId,
    );

    // 2. 檢查訂單狀態
    const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('此訂單狀態無法取消');
    }

    // 3. 使用交易取消訂單並恢復庫存
    await this.prisma.$transaction(async (tx) => {
      // Conditional: admin cancel / payment expiry may have cancelled it
      // since we read it, and they restock too.
      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: { in: cancellableStatuses } },
        data: {
          status: 'cancelled',
          notes: dto.reason
            ? `${order.notes || ''}\n取消原因: ${dto.reason}`.trim()
            : order.notes,
        },
      });

      if (count === 0) {
        throw new BadRequestException('此訂單狀態無法取消');
      }

      await restoreOrderStock(tx, order.items);
    });

    // Payment is confirmed by phone: staff must know before calling the
    // customer or packing the order. Fire-and-forget, never fails the cancel.
    this.notifications
      .createOrderCancelledNotification({
        id: order.id,
        orderNumber: order.orderNumber,
        reason: dto.reason ? `顧客取消：${dto.reason}` : '顧客取消',
      })
      .catch((err: Error) => {
        this.logger.warn(
          `Order cancelled notification failed for ${order.orderNumber}: ${err.message}`,
        );
      });

    return { message: '訂單已取消' };
  }
}
