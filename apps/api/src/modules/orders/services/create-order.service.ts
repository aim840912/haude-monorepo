import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateOrderDto } from '../dto';
import { OrderCalculator } from '../utils/order-calculator';
import { DiscountsService } from '../../discounts/discounts.service';
import { EmailService, OrderEmailData } from '../../email/email.service';
import { MembersService } from '../../members/members.service';

/**
 * 訂單建立服務
 * 負責處理訂單建立的完整流程，包含庫存檢查、折扣計算、交易處理
 */
@Injectable()
export class CreateOrderService {
  private readonly logger = new Logger(CreateOrderService.name);

  constructor(
    private prisma: PrismaService,
    private discountsService: DiscountsService,
    private emailService: EmailService,
    private membersService: MembersService,
  ) {}

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

    // 9. 生成訂單編號
    const orderNumber = await this.generateOrderNumber();

    // 10. 使用交易建立訂單並扣減庫存
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

    // 11. 記錄折扣使用（在交易外，避免過長交易）
    if (discountCode && discountAmount > 0) {
      await this.discountsService.applyDiscount(
        discountCode,
        userId,
        order.id,
        discountAmount,
      );
    }

    // 12. 發送訂單確認郵件（非同步，不阻塞回應）
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
