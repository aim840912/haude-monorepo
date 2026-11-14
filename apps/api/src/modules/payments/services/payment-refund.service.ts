import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ORDER_STATUS_TRANSITIONS,
  canTransitionOrderStatus,
  type OrderStatus,
} from '@haude/types';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { EmailService } from '@/modules/email/email.service';
import { MembersService } from '@/modules/members/members.service';
import { maskPaymentPayload } from '../utils/mask-payment-payload';
import type { RefundTypeInput } from '../dto/refund-payment.dto';

/** Order statuses the transition table allows to move to 'refunded' (shipped, delivered). */
const REFUNDABLE_ORDER_STATUSES = (
  Object.keys(ORDER_STATUS_TRANSITIONS) as OrderStatus[]
).filter((status) => canTransitionOrderStatus(status, 'refunded'));

interface RefundOrderContext {
  orderNumber: string;
  userId: string;
  totalAmount: number;
  user: { email: string; name: string | null };
}

/**
 * 退款服務
 *
 * 負責：
 * - 信用卡退款（自動透過 ECPay DoAction API）
 * - ATM/CVS 退款（建立待處理記錄，管理員線下處理後確認）
 * - 退款記錄查詢
 * - 退款通知郵件
 *
 * 狀態寫入一律「狀態符合預期才寫入」（updateMany + count），見根目錄 CLAUDE.md「訂單狀態」。
 */
@Injectable()
export class PaymentRefundService {
  private readonly logger = new Logger(PaymentRefundService.name);

  /** ECPay 信用卡退款 API URL */
  private static readonly ECPAY_DOACTION_URL =
    'https://payment.ecpay.com.tw/CreditDetail/DoAction';
  private static readonly ECPAY_DOACTION_URL_STAGE =
    'https://payment-stage.ecpay.com.tw/CreditDetail/DoAction';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: PaymentConfigService,
    private readonly emailService: EmailService,
    private readonly membersService: MembersService,
  ) {}

  // ========================================
  // 執行退款
  // ========================================

  /**
   * 執行退款
   *
   * 信用卡 → 自動呼叫 ECPay DoAction API（Action=R 退刷）
   * ATM/CVS → 建立待處理退款記錄，管理員線下匯款後手動確認
   */
  async processRefund(
    paymentId: string,
    operatorId: string,
    type: RefundTypeInput,
    amount?: number,
    reason?: string,
  ) {
    // 1. 查詢付款記錄
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { include: { user: { select: { email: true, name: true } } } },
        refunds: {
          where: { status: { in: ['completed', 'processing', 'pending'] } },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('付款記錄不存在');
    }

    if (payment.status !== 'paid') {
      throw new BadRequestException('僅已付款的訂單可以退款');
    }

    // 2. 計算退款金額
    const refundAmount = type === 'FULL' ? payment.amount : amount;
    if (!refundAmount || refundAmount <= 0) {
      throw new BadRequestException('退款金額無效');
    }

    // 3. 檢查累計退款金額
    const totalRefunded = payment.refunds
      .filter((r) => r.status !== 'failed')
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalRefunded + refundAmount > payment.amount) {
      throw new BadRequestException(
        `退款金額超過可退金額。原付款金額：${payment.amount}，已退款：${totalRefunded}，本次請求：${refundAmount}`,
      );
    }

    const isCredit = payment.paymentType === 'CREDIT';
    if (isCredit && !payment.tradeNo) {
      throw new BadRequestException('此付款無綠界交易編號，無法自動退款');
    }

    // 4. 建立退款記錄
    // The total above was read without a lock, so two clicks can both pass it and
    // refund twice. Bumping updatedAt only if it is unchanged since our read lets
    // exactly one request through before any money moves; the other's WHERE no
    // longer matches.
    const refund = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: 'paid', updatedAt: payment.updatedAt },
        data: { updatedAt: new Date() },
      });
      if (count === 0) {
        throw new ConflictException(
          '此筆付款剛被其他退款操作變更，請重新整理後再試',
        );
      }
      return tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          operatorId,
          type: type === 'FULL' ? 'FULL' : 'PARTIAL',
          status: isCredit ? 'processing' : 'pending',
          amount: refundAmount,
          reason,
        },
      });
    });

    // 5. 根據付款方式處理退款
    if (isCredit && payment.tradeNo) {
      return this.processCreditRefund(
        payment,
        payment.tradeNo,
        refund,
        refundAmount,
      );
    }

    // ATM / CVS → 人工退款流程
    this.logger.log(
      `${payment.paymentType} 人工退款已建立：${payment.order.orderNumber}，金額：${refundAmount}`,
    );

    return {
      refundId: refund.id,
      status: 'pending',
      message: `${payment.paymentType} 退款需人工處理，請線下匯款後確認`,
    };
  }

  // ========================================
  // 信用卡退款（ECPay DoAction）
  // ========================================

  private async processCreditRefund(
    payment: {
      id: string;
      merchantOrderNo: string;
      orderId: string;
      order: RefundOrderContext;
    },
    tradeNo: string,
    refund: { id: string; paymentId: string; orderId: string },
    refundAmount: number,
  ) {
    let rtnCode: string | null;
    let rtnMsg: string | null;
    const ecpayResponse: Record<string, string> = {};

    try {
      // 呼叫 ECPay DoAction API
      const { config, crypto } = this.configService.getEnabledContext();

      // 判斷是否為測試環境
      const doActionUrl = config.apiUrl.includes('-stage')
        ? PaymentRefundService.ECPAY_DOACTION_URL_STAGE
        : PaymentRefundService.ECPAY_DOACTION_URL;

      const params: Record<string, string | number> = {
        MerchantID: config.merchantId,
        MerchantTradeNo: payment.merchantOrderNo,
        TradeNo: tradeNo,
        Action: 'R', // R = 退刷
        TotalAmount: refundAmount,
      };

      // 產生 CheckMacValue
      const checkMacValue = crypto.generateCheckMacValue(params);
      params.CheckMacValue = checkMacValue;

      // 發送請求（ECPay 使用 application/x-www-form-urlencoded）
      const formBody = Object.entries(params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');

      const response = await fetch(doActionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });

      const responseText = await response.text();
      const responseParams = new URLSearchParams(responseText);
      rtnCode = responseParams.get('RtnCode');
      rtnMsg = responseParams.get('RtnMsg');

      // 將回應資料轉為 JSON 儲存
      responseParams.forEach((value, key) => {
        ecpayResponse[key] = value;
      });
    } catch (error) {
      // 請求沒送出或回應讀不到：未確認綠界有退款
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
          failReason: error instanceof Error ? error.message : '系統錯誤',
        },
      });

      this.logger.error('信用卡退款發生系統錯誤', error);
      throw new BadRequestException('退款處理失敗，請稍後再試');
    }

    if (rtnCode !== '1') {
      // 退款失敗
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
          ecpayResponse: maskPaymentPayload(ecpayResponse) as object,
          failReason: rtnMsg || '綠界退款失敗',
        },
      });

      this.logger.error(
        `信用卡退款失敗：${payment.merchantOrderNo}，RtnCode=${rtnCode}，RtnMsg=${rtnMsg}`,
      );

      throw new BadRequestException(`退款失敗：${rtnMsg || '綠界回應異常'}`);
    }

    // 綠界已退款。之後的寫入失敗不可把退款標成 failed（錢已退出），
    // 讓錯誤往上拋，退款記錄停在 processing 供人工對帳。
    const { orderRefunded } = await this.completeRefund(refund, 'processing', {
      ecpayResponse: maskPaymentPayload(ecpayResponse) as object,
    });

    if (orderRefunded) {
      await this.revokeOrderRewards(payment.orderId, payment.order);
    }

    // 發送退款通知郵件（非同步，不阻塞主流程）
    this.sendRefundNotificationEmail(
      payment.order.user.email,
      payment.order.orderNumber,
      refundAmount,
      'CREDIT',
      payment.order.user.name,
    ).catch((err) => this.logger.error('發送退款通知郵件失敗', err));

    this.logger.log(
      `信用卡退款成功：${payment.merchantOrderNo}，金額：${refundAmount}`,
    );

    return {
      refundId: refund.id,
      status: 'completed',
      message: '信用卡退款已成功處理',
    };
  }

  // ========================================
  // 確認人工退款
  // ========================================

  /**
   * 確認人工退款完成（ATM/CVS 線下匯款後）
   */
  async confirmManualRefund(
    refundId: string,
    operatorId: string,
    notes?: string,
  ) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: true,
        order: { include: { user: { select: { email: true, name: true } } } },
      },
    });

    if (!refund) {
      throw new NotFoundException('退款記錄不存在');
    }

    if (refund.status !== 'pending') {
      throw new BadRequestException(
        `無法確認此退款：當前狀態為 ${refund.status}`,
      );
    }

    const { orderRefunded } = await this.completeRefund(refund, 'pending', {
      reason: notes
        ? `${refund.reason || ''}${refund.reason ? '；' : ''}確認備註：${notes}`
        : refund.reason,
    });

    if (orderRefunded) {
      await this.revokeOrderRewards(refund.orderId, refund.order);
    }

    // 發送退款通知郵件
    this.sendRefundNotificationEmail(
      refund.order.user.email,
      refund.order.orderNumber,
      refund.amount,
      refund.payment.paymentType,
      refund.order.user.name,
    ).catch((err) => this.logger.error('發送退款通知郵件失敗', err));

    this.logger.log(`人工退款已確認：${refund.id}，操作員：${operatorId}`);

    return {
      refundId: refund.id,
      status: 'completed',
      message: '退款已確認完成',
    };
  }

  // ========================================
  // 完成退款（共用）
  // ========================================

  /**
   * 把退款標為完成；累計退完全額時才把付款與訂單標為已退款
   *
   * - 退款記錄只能從 fromStatus 轉為 completed，重複確認會被擋下
   * - 部分退款不動付款與訂單狀態
   * - 訂單狀態只在轉換表允許時（已出貨 / 已送達）才轉為 refunded；
   *   未出貨的訂單只標 paymentStatus，由後台照正常流程取消
   */
  private async completeRefund(
    refund: { id: string; paymentId: string; orderId: string },
    fromStatus: 'processing' | 'pending',
    data: { ecpayResponse?: object; reason?: string | null },
  ): Promise<{ orderRefunded: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refund.updateMany({
        where: { id: refund.id, status: fromStatus },
        data: { ...data, status: 'completed', completedAt: new Date() },
      });
      if (count === 0) {
        throw new ConflictException('此退款已被處理，請重新整理後再試');
      }

      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
        select: { amount: true },
      });
      const completed = await tx.refund.aggregate({
        where: { paymentId: refund.paymentId, status: 'completed' },
        _sum: { amount: true },
      });
      if ((completed._sum.amount ?? 0) < payment.amount) {
        return { orderRefunded: false };
      }

      await tx.payment.updateMany({
        where: { id: refund.paymentId, status: 'paid' },
        data: { status: 'refunded' },
      });
      await tx.order.update({
        where: { id: refund.orderId },
        data: { paymentStatus: 'refunded' },
      });
      const order = await tx.order.updateMany({
        where: {
          id: refund.orderId,
          status: { in: REFUNDABLE_ORDER_STATUSES },
        },
        data: { status: 'refunded' },
      });
      return { orderRefunded: order.count > 0 };
    });
  }

  /**
   * 訂單進入已退款 → 收回積分與累積消費（與後台改狀態同一套，revokeOrderRewards 本身冪等）
   */
  private async revokeOrderRewards(
    orderId: string,
    order: { userId: string; totalAmount: number },
  ) {
    try {
      const revoked = await this.membersService.revokeOrderRewards(
        order.userId,
        orderId,
        order.totalAmount,
      );
      this.logger.log(
        `訂單 ${orderId} 退款，收回 ${revoked.points} 積分、累積消費 ${revoked.totalSpent} 元`,
      );
    } catch (error) {
      this.logger.error(`收回退款訂單回饋失敗: ${error}`);
    }
  }

  // ========================================
  // 查詢退款記錄
  // ========================================

  /**
   * 查詢付款的退款記錄
   */
  async getRefundsByPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('付款記錄不存在');
    }

    const refunds = await this.prisma.refund.findMany({
      where: { paymentId },
      include: {
        operator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      paymentId,
      originalAmount: payment.amount,
      totalRefunded: refunds
        .filter((r) => r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0),
      refunds,
    };
  }

  // ========================================
  // 退款通知郵件
  // ========================================

  private async sendRefundNotificationEmail(
    to: string,
    orderNumber: string,
    refundAmount: number,
    paymentType: string,
    userName?: string | null,
  ) {
    return this.emailService.sendRefundNotificationEmail(
      to,
      orderNumber,
      refundAmount,
      paymentType,
      userName ?? undefined,
    );
  }
}
