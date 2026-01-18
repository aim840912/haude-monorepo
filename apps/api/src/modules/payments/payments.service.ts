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
import type { PaymentMethodType } from './dto/create-payment.dto';
import { EmailService } from '../email/email.service';

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
  private readonly crypto: ECPayCrypto | null = null;
  private readonly config: ECPayConfig | null = null;
  private readonly isEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    // 檢查必要的 ECPay 配置是否存在
    const merchantId = this.configService.get<string>('ECPAY_MERCHANT_ID');
    const hashKey = this.configService.get<string>('ECPAY_HASH_KEY');
    const hashIv = this.configService.get<string>('ECPAY_HASH_IV');
    const apiUrl = this.configService.get<string>('ECPAY_API_URL');
    const notifyUrl = this.configService.get<string>('ECPAY_NOTIFY_URL');
    const returnUrl = this.configService.get<string>('ECPAY_RETURN_URL');

    // 如果所有必要配置都存在，啟用支付功能
    if (merchantId && hashKey && hashIv && apiUrl && notifyUrl && returnUrl) {
      this.config = {
        merchantId,
        hashKey,
        hashIv,
        apiUrl,
        notifyUrl,
        returnUrl,
        clientBackUrl: this.configService.get('ECPAY_CLIENT_BACK_URL'),
        paymentInfoUrl: this.configService.get('ECPAY_PAYMENT_INFO_URL'),
      };
      this.crypto = new ECPayCrypto(hashKey, hashIv);
      this.isEnabled = true;
      this.logger.log('ECPay payment service initialized');
    } else {
      this.isEnabled = false;
      this.logger.warn(
        'ECPay configuration incomplete - payment service disabled. ' +
          'Set ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, ECPAY_HASH_IV, ECPAY_API_URL, ' +
          'ECPAY_NOTIFY_URL, ECPAY_RETURN_URL to enable.',
      );
    }
  }

  /**
   * 檢查支付服務是否可用並返回配置
   */
  private getEnabledConfig(): ECPayConfig {
    if (!this.isEnabled || !this.config || !this.crypto) {
      throw new BadRequestException(
        '支付功能尚未啟用，請聯繫管理員設定支付配置',
      );
    }
    return this.config;
  }

  /**
   * 檢查支付服務是否可用並返回加密工具
   */
  private getEnabledCrypto(): ECPayCrypto {
    if (!this.isEnabled || !this.config || !this.crypto) {
      throw new BadRequestException(
        '支付功能尚未啟用，請聯繫管理員設定支付配置',
      );
    }
    return this.crypto;
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
    paymentMethod: PaymentMethodType = 'CREDIT',
  ): Promise<PaymentFormData> {
    // 驗證支付服務已啟用
    const config = this.getEnabledConfig();
    const crypto = this.getEnabledCrypto();

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
      return this.generateFormData(existingPayment.id, paymentMethod);
    }

    // 3. 生成商店訂單編號
    const merchantTradeNo = generateMerchantTradeNo(order.orderNumber);

    // 4. 計算金額（取整數）
    const amount = Math.round(Number(order.totalAmount));

    // 5. 對應 ECPay 的付款類型
    const ecpayPaymentType = this.mapPaymentMethod(paymentMethod);

    // 6. 建立交易參數
    const tradeParams: ECPayTradeParams = {
      MerchantID: config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: getTradeDate(),
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: encodeURIComponent('豪德製茶所訂單'),
      ItemName: this.formatItemName(order.items),
      ReturnURL: config.notifyUrl,
      ChoosePayment: ecpayPaymentType,
      EncryptType: 1,
      ClientBackURL: config.clientBackUrl || config.returnUrl,
      OrderResultURL: config.returnUrl,
      NeedExtraPaidInfo: 'Y',
    };

    // 7. 加入付款方式專用參數
    if (paymentMethod === 'ATM') {
      tradeParams.ExpireDate = 3; // ATM 3 天內繳費
      if (config.paymentInfoUrl) {
        tradeParams.PaymentInfoURL = config.paymentInfoUrl;
      }
    } else if (paymentMethod === 'CVS') {
      tradeParams.StoreExpireDate = 10080; // CVS 7 天（10080 分鐘）
      if (config.paymentInfoUrl) {
        tradeParams.PaymentInfoURL = config.paymentInfoUrl;
      }
    }

    // 8. 生成 CheckMacValue
    const paymentData = crypto.createPaymentData(tradeParams);

    // 9. 建立 Payment 記錄
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        merchantOrderNo: merchantTradeNo,
        amount,
        paymentType: paymentMethod,
        status: 'pending',
        requestData: tradeParams as object,
      },
    });

    this.logger.log(
      `建立付款: ${payment.id}, 訂單: ${order.orderNumber}, 方式: ${paymentMethod}`,
    );

    return {
      paymentId: payment.id,
      formData: {
        action: config.apiUrl,
        method: 'POST',
        fields: paymentData,
      },
    };
  }

  /**
   * 對應前端付款方式到 ECPay ChoosePayment
   */
  private mapPaymentMethod(
    method: PaymentMethodType,
  ): ECPayTradeParams['ChoosePayment'] {
    const map: Record<PaymentMethodType, ECPayTradeParams['ChoosePayment']> = {
      CREDIT: 'Credit',
      ATM: 'ATM',
      CVS: 'CVS',
    };
    return map[method] || 'Credit';
  }

  /**
   * 使用現有付款記錄重新生成表單
   *
   * 注意：舊的付款記錄可能是其他金流系統建立的，
   * 需要確保所有綠界必要參數都存在
   */
  private async generateFormData(
    paymentId: string,
    paymentMethod: PaymentMethodType = 'CREDIT',
  ): Promise<PaymentFormData> {
    const config = this.getEnabledConfig();
    const crypto = this.getEnabledCrypto();

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

    // 對應 ECPay 的付款類型
    const ecpayPaymentType = this.mapPaymentMethod(paymentMethod);

    // 重新建立完整的綠界交易參數（而非依賴舊資料）
    const tradeParams: ECPayTradeParams = {
      MerchantID: config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: getTradeDate(),
      PaymentType: 'aio',
      TotalAmount: payment.amount,
      TradeDesc: encodeURIComponent('豪德製茶所訂單'),
      ItemName: this.formatItemName(payment.order.items),
      ReturnURL: config.notifyUrl,
      ChoosePayment: ecpayPaymentType,
      EncryptType: 1,
      ClientBackURL: config.clientBackUrl || config.returnUrl,
      OrderResultURL: config.returnUrl,
      NeedExtraPaidInfo: 'Y',
    };

    // 加入付款方式專用參數
    if (paymentMethod === 'ATM') {
      tradeParams.ExpireDate = 3;
      if (config.paymentInfoUrl) {
        tradeParams.PaymentInfoURL = config.paymentInfoUrl;
      }
    } else if (paymentMethod === 'CVS') {
      tradeParams.StoreExpireDate = 10080;
      if (config.paymentInfoUrl) {
        tradeParams.PaymentInfoURL = config.paymentInfoUrl;
      }
    }

    const paymentData = crypto.createPaymentData(tradeParams);

    // 更新付款記錄（包含新的交易編號和付款類型）
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        merchantOrderNo: merchantTradeNo,
        paymentType: paymentMethod,
        requestData: tradeParams as object,
      },
    });

    return {
      paymentId,
      formData: {
        action: config.apiUrl,
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
    const crypto = this.getEnabledCrypto();

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
            paymentMethod: payment.paymentType, // 使用實際的付款類型
            status: 'confirmed', // 付款成功後自動確認訂單
          },
        });
      });

      this.logger.log(
        `付款成功: ${merchantTradeNo}, 綠界交易號: ${body.TradeNo}`,
      );

      // 發送支付成功郵件（非同步，不阻塞回應）
      this.sendPaymentSuccessEmailAsync(
        payment.orderId,
        payment.order.orderNumber,
        payment.amount,
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

      this.logger.warn(`付款失敗: ${merchantTradeNo}, 原因: ${body.RtnMsg}`);
    }

    return true;
  }

  /**
   * 處理綠界取號結果通知（ATM/CVS）
   *
   * ATM 和 CVS 付款完成取號後，綠界會呼叫此端點
   * 回傳虛擬帳號/繳費代碼等資訊
   */
  async handlePaymentInfo(
    body: Record<string, string>,
    ipAddress?: string,
  ): Promise<boolean> {
    const crypto = this.getEnabledCrypto();

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

    // 3. 檢查回應狀態（RtnCode = 1 或 2 表示成功取號）
    // ATM: RtnCode=2 表示 ATM 取號成功
    // CVS: RtnCode=10100073 表示超商代碼已產生
    const isSuccess = rtnCode === 1 || rtnCode === 2 || rtnCode === 10100073;

    if (isSuccess) {
      // 4. 更新 Payment 記錄（儲存取號資訊）
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
        // ECPay 回傳格式：yyyy/MM/dd HH:mm:ss
        updateData.expireDate = new Date(body.ExpireDate.replace(/\//g, '-'));
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: updateData,
      });

      this.logger.log(
        `取號成功: ${merchantTradeNo}, 類型: ${payment.paymentType}, ` +
          `${body.BankCode ? `銀行: ${body.BankCode}, 帳號: ${body.vAccount}` : ''} ` +
          `${body.PaymentNo ? `代碼: ${body.PaymentNo}` : ''}`,
      );
    } else {
      this.logger.warn(`取號失敗: ${merchantTradeNo}, 原因: ${body.RtnMsg}`);
    }

    return true;
  }

  /**
   * 處理綠界返回頁面（用戶返回時）
   *
   * 驗證並解析資料，回傳導向資訊
   */
  async handleReturn(body: Record<string, string>): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    const crypto = this.getEnabledCrypto();

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

  /**
   * 非同步發送支付成功郵件
   */
  private async sendPaymentSuccessEmailAsync(
    orderId: string,
    orderNumber: string,
    amount: number,
  ): Promise<void> {
    try {
      // 取得使用者資訊
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
      // 郵件發送失敗不應影響付款流程
      this.logger.error(`發送支付成功郵件失敗: ${error}`);
    }
  }

  // ========================================
  // 管理員 API
  // ========================================

  /**
   * 取得所有付款記錄（管理員）
   */
  async getAllPayments(limit: number, offset: number) {
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        merchantOrderNo: p.merchantOrderNo,
        tradeNo: p.tradeNo,
        status: p.status,
        amount: p.amount,
        paymentType: p.paymentType,
        payTime: p.payTime,
        createdAt: p.createdAt,
        orderNumber: p.order?.orderNumber,
        userName: p.order?.user?.name,
        userEmail: p.order?.user?.email,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * 取得付款日誌（管理員）
   */
  async getPaymentLogs(limit: number, offset: number) {
    const [logs, total] = await Promise.all([
      this.prisma.paymentLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              merchantOrderNo: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.paymentLog.count(),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        merchantOrderNo: log.merchantOrderNo,
        logType: log.logType,
        verified: log.verified,
        processed: log.processed,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        paymentStatus: log.payment?.status,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * 取得付款統計（管理員）
   */
  async getPaymentStats() {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      verificationFailures,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'paid' } }),
      this.prisma.payment.count({ where: { status: 'pending' } }),
      this.prisma.payment.count({ where: { status: 'failed' } }),
      this.prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.paymentLog.count({ where: { verified: false } }),
    ]);

    return {
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      verificationFailures,
    };
  }
}
