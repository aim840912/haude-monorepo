import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateOrderStatusDto } from '../dto';
import { EmailService } from '../../email/email.service';
import { MembersService } from '../../members/members.service';

/**
 * 訂單更新服務
 * 負責處理管理員端的訂單狀態更新，包含通知和會員系統整合
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
      void this.sendShippingNotificationEmailAsync(
        order.user.email,
        order.orderNumber,
        trackingNumber,
        order.user.name,
      );
    }

    // 當訂單狀態變更為 delivered（已送達）時，更新會員累積消費並發放積分
    if (dto.status === 'delivered' && order.status !== 'delivered') {
      void this.processOrderCompletionAsync(
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
}
