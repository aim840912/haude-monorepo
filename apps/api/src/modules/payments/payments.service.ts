import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import {
  NewebPayCrypto,
  NewebPayConfig,
  TradeInfoParams,
  generateMerchantOrderNo,
  getTimestamp,
} from './utils/newebpay-crypto';

/**
 * 付款表單資料（前端用於提交到藍新）
 */
export interface PaymentFormData {
  paymentId: string;
  formData: {
    action: string;
    method: 'POST';
    fields: {
      MerchantID: string;
      TradeInfo: string;
      TradeSha: string;
      Version: string;
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly crypto: NewebPayCrypto;
  private readonly config: NewebPayConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // 初始化藍新配置
    this.config = {
      merchantId: this.configService.getOrThrow('NEWEBPAY_MERCHANT_ID'),
      hashKey: this.configService.getOrThrow('NEWEBPAY_HASH_KEY'),
      hashIv: this.configService.getOrThrow('NEWEBPAY_HASH_IV'),
      apiUrl: this.configService.getOrThrow('NEWEBPAY_API_URL'),
      notifyUrl: this.configService.getOrThrow('NEWEBPAY_NOTIFY_URL'),
      returnUrl: this.configService.getOrThrow('NEWEBPAY_RETURN_URL'),
      version: '2.0',
    };

    this.crypto = new NewebPayCrypto(this.config.hashKey, this.config.hashIv);
  }

  // ========================================
  // 建立付款
  // ========================================

  /**
   * 建立付款請求
   *
   * 1. 驗證訂單存在且狀態可付款
   * 2. 建立 Payment 記錄
   * 3. 生成藍新加密參數
   * 4. 回傳前端表單資料
   */
  async createPayment(
    orderId: string,
    userId: string,
  ): Promise<PaymentFormData> {
    // 1. 驗證訂單
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在或無權限');
    }

    // 檢查訂單狀態
    if (order.status !== 'pending') {
      throw new BadRequestException('此訂單狀態無法付款');
    }

    // 檢查付款狀態
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('此訂單已完成付款');
    }

    // 2. 檢查是否已有進行中的付款
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: 'pending',
      },
    });

    if (existingPayment) {
      // 使用現有的付款記錄重新生成表單
      return this.generateFormData(existingPayment.id);
    }

    // 3. 生成商店訂單編號
    const merchantOrderNo = generateMerchantOrderNo(order.orderNumber);

    // 4. 計算金額（取整數）
    const amount = Math.round(Number(order.totalAmount));

    // 5. 建立交易參數
    const tradeParams: TradeInfoParams = {
      MerchantID: this.config.merchantId,
      RespondType: 'JSON',
      TimeStamp: getTimestamp(),
      Version: '2.0',
      MerchantOrderNo: merchantOrderNo,
      Amt: amount,
      ItemDesc: this.formatItemDesc(order.items),
      NotifyURL: this.config.notifyUrl,
      ReturnURL: this.config.returnUrl,
      CREDIT: 1, // 啟用信用卡
    };

    // 6. 生成加密資料
    const paymentData = this.crypto.createPaymentData(tradeParams, {
      merchantId: this.config.merchantId,
      version: '2.0',
    });

    // 7. 建立 Payment 記錄
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        merchantOrderNo,
        amount,
        paymentType: 'CREDIT',
        status: 'pending',
        requestData: tradeParams as object,
      },
    });

    this.logger.log(`建立付款: ${payment.id}, 訂單: ${order.orderNumber}`);

    return {
      paymentId: payment.id,
      formData: {
        action: this.config.apiUrl,
        method: 'POST',
        fields: paymentData,
      },
    };
  }

  /**
   * 使用現有付款記錄重新生成表單
   */
  private async generateFormData(paymentId: string): Promise<PaymentFormData> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.requestData) {
      throw new NotFoundException('付款記錄不存在');
    }

    const tradeParams = payment.requestData as unknown as TradeInfoParams;

    // 更新時間戳
    tradeParams.TimeStamp = getTimestamp();

    const paymentData = this.crypto.createPaymentData(tradeParams, {
      merchantId: this.config.merchantId,
      version: '2.0',
    });

    // 更新請求資料
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { requestData: tradeParams as object },
    });

    return {
      paymentId,
      formData: {
        action: this.config.apiUrl,
        method: 'POST',
        fields: paymentData,
      },
    };
  }

  // ========================================
  // 處理藍新回調
  // ========================================

  /**
   * 處理藍新付款通知（Webhook）
   *
   * 1. 驗證簽章
   * 2. 解密回應資料
   * 3. 記錄到 PaymentLog
   * 4. 更新 Payment 狀態
   * 5. 更新 Order 狀態
   */
  async handleNotify(
    tradeInfo: string,
    tradeSha: string,
    ipAddress?: string,
  ): Promise<boolean> {
    // 1. 解密並驗證
    const response = this.crypto.decryptResponse(tradeInfo, tradeSha);

    if (!response) {
      this.logger.error('藍新回調驗證失敗');
      await this.createPaymentLog({
        merchantOrderNo: 'UNKNOWN',
        logType: 'error',
        rawData: { tradeInfo, tradeSha, error: '簽章驗證失敗' },
        verified: false,
        ipAddress,
      });
      return false;
    }

    const merchantOrderNo = response.Result?.MerchantOrderNo || 'UNKNOWN';

    // 2. 記錄回調日誌
    const payment = await this.prisma.payment.findUnique({
      where: { merchantOrderNo },
      include: { order: true },
    });

    await this.createPaymentLog({
      paymentId: payment?.id,
      merchantOrderNo,
      logType: 'notify',
      rawData: response,
      verified: true,
      ipAddress,
    });

    if (!payment) {
      this.logger.error(`找不到付款記錄: ${merchantOrderNo}`);
      return false;
    }

    // 3. 檢查是否已處理（冪等性）
    if (payment.status === 'paid') {
      this.logger.log(`付款已處理過: ${merchantOrderNo}`);
      return true;
    }

    // 4. 檢查回應狀態
    const isSuccess = response.Status === 'SUCCESS';

    if (isSuccess && response.Result) {
      // 付款成功
      await this.prisma.$transaction(async (tx) => {
        // 更新 Payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'paid',
            tradeNo: response.Result!.TradeNo,
            payTime: new Date(response.Result!.PayTime),
            responseData: response as object,
          },
        });

        // 更新 Order
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'paid',
            paymentMethod: 'CREDIT',
            status: 'confirmed', // 付款成功後自動確認訂單
          },
        });
      });

      this.logger.log(
        `付款成功: ${merchantOrderNo}, 藍新交易號: ${response.Result.TradeNo}`,
      );
    } else {
      // 付款失敗
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          responseData: response as object,
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'failed' },
      });

      this.logger.warn(
        `付款失敗: ${merchantOrderNo}, 原因: ${response.Message}`,
      );
    }

    return true;
  }

  /**
   * 處理藍新返回頁面（用戶返回時）
   *
   * 驗證並解密資料，回傳導向資訊
   */
  async handleReturn(
    tradeInfo: string,
    tradeSha: string,
  ): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    const response = this.crypto.decryptResponse(tradeInfo, tradeSha);

    if (!response) {
      return { success: false, message: '驗證失敗' };
    }

    const merchantOrderNo = response.Result?.MerchantOrderNo;
    if (!merchantOrderNo) {
      return { success: false, message: '無效的回應' };
    }

    // 記錄返回日誌
    const payment = await this.prisma.payment.findUnique({
      where: { merchantOrderNo },
    });

    await this.createPaymentLog({
      paymentId: payment?.id,
      merchantOrderNo,
      logType: 'return',
      rawData: response,
      verified: true,
    });

    const isSuccess = response.Status === 'SUCCESS';

    return {
      success: isSuccess,
      orderId: payment?.orderId,
      message: response.Message,
    };
  }

  // ========================================
  // 查詢付款狀態
  // ========================================

  /**
   * 查詢訂單的付款狀態
   */
  async getPaymentStatus(
    orderId: string,
    userId: string,
  ): Promise<{
    status: PaymentStatus;
    payTime?: Date;
    tradeNo?: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: payment?.status || order.paymentStatus,
      payTime: payment?.payTime ?? undefined,
      tradeNo: payment?.tradeNo ?? undefined,
    };
  }

  // ========================================
  // 工具方法
  // ========================================

  /**
   * 格式化商品描述（藍新限制 50 字元）
   */
  private formatItemDesc(
    items: Array<{ productName: string; quantity: number }>,
  ): string {
    const desc = items.map((i) => `${i.productName}x${i.quantity}`).join(', ');
    return desc.length > 50 ? desc.slice(0, 47) + '...' : desc;
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
}
