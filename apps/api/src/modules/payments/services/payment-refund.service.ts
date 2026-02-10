import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { EmailService } from '@/modules/email/email.service';
import type { RefundTypeInput } from '../dto/refund-payment.dto';

/**
 * 退款服務
 *
 * 負責：
 * - 信用卡退款（自動透過 ECPay DoAction API）
 * - ATM/CVS 退款（建立待處理記錄，管理員線下處理後確認）
 * - 退款記錄查詢
 * - 退款通知郵件
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
        refunds: { where: { status: { in: ['completed', 'processing', 'pending'] } } },
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

    // 4. 根據付款方式處理退款
    const refundType = type === 'FULL' ? 'FULL' : 'PARTIAL';

    if (payment.paymentType === 'CREDIT') {
      return this.processCreditRefund(
        payment,
        operatorId,
        refundType,
        refundAmount,
        reason,
      );
    } else {
      // ATM / CVS → 人工退款流程
      return this.createManualRefund(
        payment,
        operatorId,
        refundType,
        refundAmount,
        reason,
      );
    }
  }

  // ========================================
  // 信用卡退款（ECPay DoAction）
  // ========================================

  private async processCreditRefund(
    payment: {
      id: string;
      merchantOrderNo: string;
      tradeNo: string | null;
      amount: number;
      orderId: string;
      order: {
        orderNumber: string;
        user: { email: string; name: string | null };
      };
    },
    operatorId: string,
    refundType: 'FULL' | 'PARTIAL',
    refundAmount: number,
    reason?: string,
  ) {
    if (!payment.tradeNo) {
      throw new BadRequestException(
        '此付款無綠界交易編號，無法自動退款',
      );
    }

    // 建立退款記錄（processing 狀態）
    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        operatorId,
        type: refundType,
        status: 'processing',
        amount: refundAmount,
        reason,
      },
    });

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
        TradeNo: payment.tradeNo,
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
      const rtnCode = responseParams.get('RtnCode');
      const rtnMsg = responseParams.get('RtnMsg');

      // 將回應資料轉為 JSON 儲存
      const ecpayResponse: Record<string, string> = {};
      responseParams.forEach((value, key) => {
        ecpayResponse[key] = value;
      });

      if (rtnCode === '1') {
        // 退款成功
        await this.prisma.$transaction([
          this.prisma.refund.update({
            where: { id: refund.id },
            data: {
              status: 'completed',
              ecpayResponse: ecpayResponse,
              completedAt: new Date(),
            },
          }),
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'refunded' },
          }),
          this.prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: 'refunded',
              status: 'refunded',
            },
          }),
        ]);

        // 發送退款通知郵件（非同步，不阻塞主流程）
        this.sendRefundNotificationEmail(
          payment.order.user.email,
          payment.order.orderNumber,
          refundAmount,
          'CREDIT',
          payment.order.user.name,
        ).catch((err) =>
          this.logger.error('發送退款通知郵件失敗', err),
        );

        this.logger.log(
          `信用卡退款成功：${payment.merchantOrderNo}，金額：${refundAmount}`,
        );

        return {
          refundId: refund.id,
          status: 'completed',
          message: '信用卡退款已成功處理',
        };
      } else {
        // 退款失敗
        await this.prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'failed',
            ecpayResponse: ecpayResponse,
            failReason: rtnMsg || '綠界退款失敗',
          },
        });

        this.logger.error(
          `信用卡退款失敗：${payment.merchantOrderNo}，RtnCode=${rtnCode}，RtnMsg=${rtnMsg}`,
        );

        throw new BadRequestException(
          `退款失敗：${rtnMsg || '綠界回應異常'}`,
        );
      }
    } catch (error) {
      // 如果是已經處理過的 BadRequestException，直接拋出
      if (error instanceof BadRequestException) throw error;

      // 未預期錯誤
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
  }

  // ========================================
  // ATM/CVS 人工退款
  // ========================================

  private async createManualRefund(
    payment: {
      id: string;
      amount: number;
      orderId: string;
      paymentType: string;
      order: {
        orderNumber: string;
        user: { email: string; name: string | null };
      };
    },
    operatorId: string,
    refundType: 'FULL' | 'PARTIAL',
    refundAmount: number,
    reason?: string,
  ) {
    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        operatorId,
        type: refundType,
        status: 'pending',
        amount: refundAmount,
        reason,
      },
    });

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

    await this.prisma.$transaction([
      this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          reason: notes ? `${refund.reason || ''}${refund.reason ? '；' : ''}確認備註：${notes}` : refund.reason,
        },
      }),
      this.prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: 'refunded' },
      }),
      this.prisma.order.update({
        where: { id: refund.orderId },
        data: {
          paymentStatus: 'refunded',
          status: 'refunded',
        },
      }),
    ]);

    // 發送退款通知郵件
    this.sendRefundNotificationEmail(
      refund.order.user.email,
      refund.order.orderNumber,
      refund.amount,
      refund.payment.paymentType,
      refund.order.user.name,
    ).catch((err) =>
      this.logger.error('發送退款通知郵件失敗', err),
    );

    this.logger.log(
      `人工退款已確認：${refund.id}，操作員：${operatorId}`,
    );

    return {
      refundId: refund.id,
      status: 'completed',
      message: '退款已確認完成',
    };
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
