import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { EmailService } from '../../email/email.service';

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
        merchantOrderNo: body.MerchantTradeNo || 'UNKNOWN',
        logType: 'error',
        rawData: { ...body, error: 'CheckMacValue 驗證失敗' },
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

    // 4. 檢查回應狀態（RtnCode = 1 表示成功）
    const isSuccess = rtnCode === 1;

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
        merchantOrderNo: body.MerchantTradeNo || 'UNKNOWN',
        logType: 'error',
        rawData: { ...body, error: 'CheckMacValue 驗證失敗' },
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
    await this.prisma.$transaction(async (tx) => {
      // 更新 Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          tradeNo: body.TradeNo,
          payTime: body.PaymentDate ? new Date(body.PaymentDate) : new Date(),
          responseData: body as object,
        },
      });

      // 更新 Order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'paid',
          paymentMethod: payment.paymentType,
          status: 'confirmed',
        },
      });
    });

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
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          responseData: body as object,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
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
      responseData: body as object,
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
        rawData: data.rawData as object,
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
