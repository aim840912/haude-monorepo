import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { EmailService } from '../../email/email.service';
import { maskPaymentPayload } from '../utils/mask-payment-payload';

/** Payment statuses a success notification may move to 'paid'. */
const PAYABLE_STATUSES = ['pending', 'failed'] as const;

/** Thrown inside the success transaction to roll back when the order can no longer be paid. */
class OrderNotPayableError extends Error {}

/** ECPay MerchantTradeNo is at most 20 chars; anything longer from an unverified body is junk. */
const MAX_TRADE_NO_LENGTH = 20;

/** Unverified (bad CheckMacValue) bodies are attacker-controlled: keep only a bounded trade number. */
function untrustedTradeNo(body: Record<string, string>): string {
  const value = body.MerchantTradeNo;
  return typeof value === 'string' && value
    ? value.slice(0, MAX_TRADE_NO_LENGTH)
    : 'UNKNOWN';
}

/**
 * 付款回調處理服務
 *
 * 負責：
 * - 處理綠界付款通知（Webhook）
 * - 處理 ATM/CVS 取號通知
 * - 處理用戶返回頁面
 * - 記錄付款日誌
 */
@Injectable()
export class PaymentCallbackService {
  private readonly logger = new Logger(PaymentCallbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentConfig: PaymentConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 處理綠界付款通知（Webhook）
   *
   * 1. 驗證 CheckMacValue
   * 2. 記錄到 PaymentLog
   * 3. 更新 Payment 狀態
   * 4. 更新 Order 狀態
   */
  async handleNotify(
    body: Record<string, string>,
    ipAddress?: string,
  ): Promise<boolean> {
    const crypto = this.paymentConfig.getCrypto();

    // 1. 驗證 CheckMacValue
    if (!crypto.verifyCheckMacValue(body)) {
      this.logger.error('綠界回調驗證失敗');
      await this.createPaymentLog({
        merchantOrderNo: untrustedTradeNo(body),
        logType: 'error',
        rawData: { error: 'CheckMacValue 驗證失敗' },
        verified: false,
        ipAddress,
      });
      return false;
    }

    const merchantTradeNo = body.MerchantTradeNo;
    const rtnCode = parseInt(body.RtnCode, 10);

    // 2. 記錄回調日誌
    const payment = await this.prisma.payment.findUnique({
      where: { merchantOrderNo: merchantTradeNo },
      include: { order: true },
    });

    await this.createPaymentLog({
      paymentId: payment?.id,
      merchantOrderNo: merchantTradeNo,
      logType: 'notify',
      rawData: body,
      verified: true,
      ipAddress,
    });

    if (!payment) {
      this.logger.error(`找不到付款記錄: ${merchantTradeNo}`);
      return false;
    }

    // 3. 檢查是否已處理（冪等性）
    if (payment.status === 'paid') {
      this.logger.log(`付款已處理過: ${merchantTradeNo}`);
      return true;
    }

    // A success may land on a pending or an earlier-failed payment (the money did arrive).
    // Refunded / expired payments belong to closed orders and must never flip back to
    // paid; a late success there means money arrived for a closed order.
    if (!(PAYABLE_STATUSES as readonly string[]).includes(payment.status)) {
      this.logger.error(
        `付款狀態為 ${payment.status}，忽略此通知（RtnCode=${body.RtnCode}），` +
          `若為成功通知需人工確認是否退款: ${merchantTradeNo}`,
      );
      return true;
    }

    // 4. 檢查回應狀態（RtnCode = 1 表示成功）
    const isSuccess = rtnCode === 1;

    if (isSuccess && !this.matchesPaymentRecord(payment, body)) {
      return true;
    }

    if (isSuccess) {
      await this.handlePaymentSuccess(payment, body);
    } else {
      await this.handlePaymentFailure(payment, body);
    }

    return true;
  }

  /**
   * 處理綠界取號結果通知（ATM/CVS）
   */
  async handlePaymentInfo(
    body: Record<string, string>,
    ipAddress?: string,
  ): Promise<boolean> {
    const crypto = this.paymentConfig.getCrypto();

    // 1. 驗證 CheckMacValue
    if (!crypto.verifyCheckMacValue(body)) {
      this.logger.error('綠界取號通知驗證失敗');
      await this.createPaymentLog({
        merchantOrderNo: untrustedTradeNo(body),
        logType: 'error',
        rawData: { error: 'CheckMacValue 驗證失敗' },
        verified: false,
        ipAddress,
      });
      return false;
    }

    const merchantTradeNo = body.MerchantTradeNo;
    const rtnCode = parseInt(body.RtnCode, 10);

    // 2. 記錄取號日誌
    const payment = await this.prisma.payment.findUnique({
      where: { merchantOrderNo: merchantTradeNo },
      include: { order: true },
    });

    await this.createPaymentLog({
      paymentId: payment?.id,
      merchantOrderNo: merchantTradeNo,
      logType: 'payment_info',
      rawData: body,
      verified: true,
      ipAddress,
    });

    if (!payment) {
      this.logger.error(`找不到付款記錄: ${merchantTradeNo}`);
      return false;
    }

    // 3. 檢查回應狀態
    // ATM: RtnCode=2 表示 ATM 取號成功
    // CVS: RtnCode=10100073 表示超商代碼已產生
    const isSuccess = rtnCode === 1 || rtnCode === 2 || rtnCode === 10100073;

    if (isSuccess) {
      await this.savePaymentInfoData(payment.id, payment.paymentType, body);
    } else {
      this.logger.warn(`取號失敗: ${merchantTradeNo}, 原因: ${body.RtnMsg}`);
    }

    return true;
  }

  /**
   * 處理綠界返回頁面（用戶返回時）
   */
  async handleReturn(body: Record<string, string>): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    const crypto = this.paymentConfig.getCrypto();

    // 驗證 CheckMacValue
    if (!crypto.verifyCheckMacValue(body)) {
      return { success: false, message: '驗證失敗' };
    }

    const merchantTradeNo = body.MerchantTradeNo;
    if (!merchantTradeNo) {
      return { success: false, message: '無效的回應' };
    }

    // 記錄返回日誌
    const payment = await this.prisma.payment.findUnique({
      where: { merchantOrderNo: merchantTradeNo },
    });

    await this.createPaymentLog({
      paymentId: payment?.id,
      merchantOrderNo: merchantTradeNo,
      logType: 'return',
      rawData: body,
      verified: true,
    });

    const rtnCode = parseInt(body.RtnCode, 10);
    const isSuccess = rtnCode === 1;

    return {
      success: isSuccess,
      orderId: payment?.orderId,
      message: body.RtnMsg,
    };
  }

  /**
   * 成功通知的金額與商店代號必須與我們的付款記錄一致，否則不寫入
   */
  private matchesPaymentRecord(
    payment: { amount: number },
    body: Record<string, string>,
  ): boolean {
    const { merchantId } = this.paymentConfig.getConfig();
    const tradeAmt = parseInt(body.TradeAmt, 10);

    if (body.MerchantID !== merchantId || tradeAmt !== payment.amount) {
      this.logger.error(
        `付款通知與記錄不符，不寫入：${body.MerchantTradeNo}` +
          `（商店代號 ${body.MerchantID === merchantId ? '相符' : '不符'}，` +
          `金額 ${body.TradeAmt} vs ${payment.amount}）`,
      );
      return false;
    }
    return true;
  }

  /**
   * 處理付款成功
   */
  private async handlePaymentSuccess(
    payment: {
      id: string;
      orderId: string;
      order: { orderNumber: string } | null;
      paymentType: string;
    },
    body: Record<string, string>,
  ): Promise<void> {
    let applied: boolean;
    try {
      applied = await this.prisma.$transaction(async (tx) => {
        // Conditional update: the status check in handleNotify runs outside this
        // transaction, so two near-simultaneous ECPay retries can both pass it.
        // The WHERE clause makes the database the idempotency guard — only one wins.
        const { count } = await tx.payment.updateMany({
          where: { id: payment.id, status: { in: [...PAYABLE_STATUSES] } },
          data: {
            status: 'paid',
            tradeNo: body.TradeNo,
            payTime: body.PaymentDate ? new Date(body.PaymentDate) : new Date(),
            responseData: maskPaymentPayload(body) as object,
          },
        });
        if (count === 0) return false;

        // The order may have been cancelled (e.g. payment expiry) since it was read.
        // Throwing rolls back the payment update so the two never disagree.
        const order = await tx.order.updateMany({
          where: {
            id: payment.orderId,
            status: { in: ['pending', 'confirmed'] },
          },
          data: {
            paymentStatus: 'paid',
            paymentMethod: payment.paymentType,
            status: 'confirmed',
          },
        });
        if (order.count === 0) throw new OrderNotPayableError();
        return true;
      });
    } catch (error) {
      if (!(error instanceof OrderNotPayableError)) throw error;
      this.logger.error(
        `收到付款成功通知，但訂單已不是待付款狀態（可能已取消），` +
          `需人工確認是否退款: ${body.MerchantTradeNo}`,
      );
      return;
    }

    if (!applied) {
      // Benign only if a concurrent notification already marked it paid. Anything
      // else (e.g. order expiry set it to 'expired' meanwhile) means money arrived
      // for a closed order.
      const current = await this.prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      if (current?.status === 'paid') {
        this.logger.log(`付款已由並行通知處理: ${body.MerchantTradeNo}`);
      } else {
        this.logger.error(
          `收到付款成功通知，但付款已變為 ${current?.status ?? '不存在'}（可能已逾期取消），` +
            `需人工確認是否退款: ${body.MerchantTradeNo}`,
        );
      }
      return;
    }

    this.logger.log(
      `付款成功: ${body.MerchantTradeNo}, 綠界交易號: ${body.TradeNo}`,
    );

    // 發送支付成功郵件（非同步，不阻塞回應）
    if (payment.order) {
      void this.sendPaymentSuccessEmailAsync(
        payment.orderId,
        payment.order.orderNumber,
        parseInt(body.TradeAmt, 10),
      );
    }
  }

  /**
   * 處理付款失敗
   */
  private async handlePaymentFailure(
    payment: { id: string; orderId: string },
    body: Record<string, string>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Only a pending payment can fail: never downgrade one a concurrent success
      // notification already marked paid, nor rewrite a refunded / expired one.
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: {
          status: 'failed',
          responseData: maskPaymentPayload(body) as object,
        },
      });
      if (count === 0) return;

      await tx.order.updateMany({
        where: { id: payment.orderId, status: 'pending' },
        data: { paymentStatus: 'failed' },
      });
    });

    this.logger.warn(`付款失敗: ${body.MerchantTradeNo}, 原因: ${body.RtnMsg}`);
  }

  /**
   * 儲存取號資訊
   */
  private async savePaymentInfoData(
    paymentId: string,
    paymentType: string,
    body: Record<string, string>,
  ): Promise<void> {
    const updateData: {
      tradeNo?: string;
      bankCode?: string;
      vaAccount?: string;
      paymentCode?: string;
      expireDate?: Date;
      responseData: object;
    } = {
      tradeNo: body.TradeNo || undefined,
      responseData: maskPaymentPayload(body) as object,
    };

    // ATM 取號資訊
    if (body.BankCode) {
      updateData.bankCode = body.BankCode;
    }
    if (body.vAccount) {
      updateData.vaAccount = body.vAccount;
    }

    // CVS 取號資訊
    if (body.PaymentNo) {
      updateData.paymentCode = body.PaymentNo;
    }

    // 繳費期限
    if (body.ExpireDate) {
      updateData.expireDate = new Date(body.ExpireDate.replace(/\//g, '-'));
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    this.logger.log(
      `取號成功: ${body.MerchantTradeNo}, 類型: ${paymentType}, ` +
        `${body.BankCode ? `銀行: ${body.BankCode}, 帳號: ${body.vAccount}` : ''} ` +
        `${body.PaymentNo ? `代碼: ${body.PaymentNo}` : ''}`,
    );
  }

  /**
   * 建立付款日誌
   */
  private async createPaymentLog(data: {
    paymentId?: string;
    merchantOrderNo: string;
    logType: string;
    rawData: unknown;
    verified: boolean;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.paymentLog.create({
      data: {
        paymentId: data.paymentId,
        merchantOrderNo: data.merchantOrderNo,
        logType: data.logType,
        // 遮罩後才落地：原始回調含虛擬帳號 / 卡號前六後四等資料，
        // 這些值已存在 Payment 的結構化欄位，稽核日誌不需要第二份完整副本
        rawData: maskPaymentPayload(data.rawData) as object,
        verified: data.verified,
        ipAddress: data.ipAddress,
        processed: true,
      },
    });
  }

  /**
   * 非同步發送支付成功郵件
   */
  private async sendPaymentSuccessEmailAsync(
    orderId: string,
    orderNumber: string,
    amount: number,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      if (!order?.user?.email) {
        this.logger.warn(`無法發送支付成功郵件：找不到使用者 email`);
        return;
      }

      await this.emailService.sendPaymentSuccessEmail(
        order.user.email,
        orderNumber,
        amount,
        order.user.name || undefined,
      );
    } catch (error) {
      this.logger.error(`發送支付成功郵件失敗: ${error}`);
    }
  }
}
