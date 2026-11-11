import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { canTransitionOrderStatus } from '@haude/types';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateOrderStatusDto } from '../dto';
import { EmailService } from '../../email/email.service';
import { MembersService } from '../../members/members.service';
import { restoreOrderStock } from './order-stock';

/**
 * 訂單更新服務
 * 負責處理管理員端的訂單狀態更新，包含通知和會員系統整合
 *
 * 狀態只能照 ORDER_STATUS_TRANSITIONS（@haude/types）轉換，副作用綁在
 * 「進入某狀態」：
 * - cancelled → 補回庫存（與狀態更新同一個交易）
 * - shipped   → 寄出貨通知
 * - delivered → 累積消費 + 發點數（已發過就不再發）
 * - refunded  → 收回這張訂單給的點數與累積消費（不補庫存：商品已寄出）
 */
@Injectable()
export class UpdateOrderService {
  private readonly logger = new Logger(UpdateOrderService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private membersService: MembersService,
  ) {}

  /**
   * 更新訂單狀態（管理員）
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { email: true, name: true },
        },
        items: {
          select: { productId: true, quantity: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    const nextStatus =
      dto.status && dto.status !== order.status ? dto.status : undefined;

    if (nextStatus && !canTransitionOrderStatus(order.status, nextStatus)) {
      throw new BadRequestException(
        `訂單狀態無法從 ${order.status} 改為 ${nextStatus}`,
      );
    }

    const updateData: Prisma.OrderUpdateManyMutationInput = {};

    if (nextStatus) updateData.status = nextStatus;
    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.notes) updateData.notes = dto.notes;
    if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Conditional on the status we validated against: if another request
      // changed it in between, the transition check above no longer holds.
      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: updateData,
      });

      if (count === 0) {
        throw new ConflictException(
          '訂單狀態已被其他操作變更，請重新整理後再試',
        );
      }

      if (nextStatus === 'cancelled') {
        await restoreOrderStock(tx, order.items);
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
      });
    });

    if (
      nextStatus === 'shipped' &&
      (dto.trackingNumber || order.trackingNumber)
    ) {
      const trackingNumber = dto.trackingNumber || order.trackingNumber || '';
      void this.sendShippingNotificationEmailAsync(
        order.user.email,
        order.orderNumber,
        trackingNumber,
        order.user.name,
      );
    }

    if (nextStatus === 'delivered') {
      // Awaited (it never throws): a quick delivered → refunded must not let
      // the revoke run before the award has been written.
      await this.processOrderCompletionAsync(
        order.userId,
        order.id,
        order.totalAmount,
      );
    }

    if (nextStatus === 'refunded') {
      await this.revokeOrderRewardsAsync(
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
      // Defence in depth: the transition table already makes delivered a
      // one-way door, but a second award would double both points and totalSpent.
      const alreadyAwarded = await this.prisma.pointTransaction.findFirst({
        where: { orderId, type: 'PURCHASE' },
        select: { id: true },
      });
      if (alreadyAwarded) {
        this.logger.warn(`訂單 ${orderId} 已發過積分，略過`);
        return;
      }

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
   * 非同步收回退款訂單的積分
   */
  private async revokeOrderRewardsAsync(
    userId: string,
    orderId: string,
    orderAmount: number,
  ) {
    try {
      const revoked = await this.membersService.revokeOrderRewards(
        userId,
        orderId,
        orderAmount,
      );
      this.logger.log(
        `訂單 ${orderId} 退款，收回 ${revoked.points} 積分、累積消費 ${revoked.totalSpent} 元`,
      );
    } catch (error) {
      this.logger.error(`收回退款訂單回饋失敗: ${error}`);
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
}
