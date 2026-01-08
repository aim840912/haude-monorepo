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
  ECPayCrypto,
  ECPayConfig,
  ECPayTradeParams,
  generateMerchantTradeNo,
  getTradeDate,
} from './utils/ecpay-crypto';

/**
 * 付款表單資料（前端用於提交到綠界）
 */
export interface PaymentFormData {
  paymentId: string;
  formData: {
    action: string;
    method: 'POST';
    fields: Record<string, string | number>;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly crypto: ECPayCrypto;
  private readonly config: ECPayConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // 初始化綠界配置
    this.config = {
      merchantId: this.configService.getOrThrow('ECPAY_MERCHANT_ID'),
      hashKey: this.configService.getOrThrow('ECPAY_HASH_KEY'),
      hashIv: this.configService.getOrThrow('ECPAY_HASH_IV'),
      apiUrl: this.configService.getOrThrow('ECPAY_API_URL'),
      notifyUrl: this.configService.getOrThrow('ECPAY_NOTIFY_URL'),
      returnUrl: this.configService.getOrThrow('ECPAY_RETURN_URL'),
      clientBackUrl: this.configService.get('ECPAY_CLIENT_BACK_URL'),
    };

    this.crypto = new ECPayCrypto(this.config.hashKey, this.config.hashIv);
  }

  // ========================================
  // 建立付款
  // ========================================

  /**
   * 建立付款請求
   *
   * 1. 驗證訂單存在且狀態可付款
   * 2. 建立 Payment 記錄
   * 3. 生成綠界加密參數
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
    const merchantTradeNo = generateMerchantTradeNo(order.orderNumber);

    // 4. 計算金額（取整數）
    const amount = Math.round(Number(order.totalAmount));

    // 5. 建立交易參數
    const tradeParams: ECPayTradeParams = {
      MerchantID: this.config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: getTradeDate(),
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: encodeURIComponent('豪德製茶所訂單'),
      ItemName: this.formatItemName(order.items),
      ReturnURL: this.config.notifyUrl,
      ChoosePayment: 'Credit',
      EncryptType: 1,
      ClientBackURL: this.config.clientBackUrl || this.config.returnUrl,
      OrderResultURL: this.config.returnUrl,
      NeedExtraPaidInfo: 'Y',
    };

    // 6. 生成 CheckMacValue
    const paymentData = this.crypto.createPaymentData(tradeParams);

    // 7. 建立 Payment 記錄
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        merchantOrderNo: merchantTradeNo,
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
   *
   * 注意：舊的付款記錄可能是其他金流系統建立的，
   * 需要確保所有綠界必要參數都存在
   */
  private async generateFormData(paymentId: string): Promise<PaymentFormData> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true } } },
    });

    if (!payment || !payment.order) {
      throw new NotFoundException('付款記錄不存在');
    }

    // 檢查交易編號長度（綠界限制 20 字元）
    let merchantTradeNo = payment.merchantOrderNo;
    if (merchantTradeNo.length > 20) {
      // 舊編號太長，重新產生符合綠界規格的編號
      merchantTradeNo = generateMerchantTradeNo(payment.order.orderNumber);
    }

    // 重新建立完整的綠界交易參數（而非依賴舊資料）
    const tradeParams: ECPayTradeParams = {
      MerchantID: this.config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: getTradeDate(),
      PaymentType: 'aio',
      TotalAmount: payment.amount,
      TradeDesc: encodeURIComponent('豪德製茶所訂單'),
      ItemName: this.formatItemName(payment.order.items),
      ReturnURL: this.config.notifyUrl,
      ChoosePayment: 'Credit',
      EncryptType: 1,
      ClientBackURL: this.config.clientBackUrl || this.config.returnUrl,
      OrderResultURL: this.config.returnUrl,
      NeedExtraPaidInfo: 'Y',
    };

    const paymentData = this.crypto.createPaymentData(tradeParams);

    // 更新付款記錄（包含新的交易編號）
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        merchantOrderNo: merchantTradeNo,
        requestData: tradeParams as object,
      },
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
  // 處理綠界回調
  // ========================================

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
    // 1. 驗證 CheckMacValue
    if (!this.crypto.verifyCheckMacValue(body)) {
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
      // 付款成功
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
            paymentMethod: 'CREDIT',
            status: 'confirmed', // 付款成功後自動確認訂單
          },
        });
      });

      this.logger.log(
        `付款成功: ${merchantTradeNo}, 綠界交易號: ${body.TradeNo}`,
      );
    } else {
      // 付款失敗
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          responseData: body as object,
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'failed' },
      });

      this.logger.warn(
        `付款失敗: ${merchantTradeNo}, 原因: ${body.RtnMsg}`,
      );
    }

    return true;
  }

  /**
   * 處理綠界返回頁面（用戶返回時）
   *
   * 驗證並解析資料，回傳導向資訊
   */
  async handleReturn(
    body: Record<string, string>,
  ): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    // 驗證 CheckMacValue
    if (!this.crypto.verifyCheckMacValue(body)) {
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
   * 格式化商品名稱（綠界 ItemName 格式）
   *
   * 多項商品用 # 分隔，單項最多 400 字元
   */
  private formatItemName(
    items: Array<{ productName: string; quantity: number }>,
  ): string {
    const names = items.map((i) => `${i.productName} x ${i.quantity}`);
    const result = names.join('#');
    return result.length > 400 ? result.slice(0, 397) + '...' : result;
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
