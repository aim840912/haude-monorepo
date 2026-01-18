import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CancelOrderDto } from '../dto';
import { QueryUserOrdersService } from './query-user-orders.service';

/**
 * 訂單取消服務
 * 負責處理使用者端的訂單取消操作，包含狀態驗證和庫存恢復
 */
@Injectable()
export class CancelOrderService {
  constructor(
    private prisma: PrismaService,
    private queryUserOrdersService: QueryUserOrdersService,
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
}
