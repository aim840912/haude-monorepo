import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ECPayTradeParams,
  generateMerchantTradeNo,
  getTradeDate,
} from '../utils/ecpay-crypto';
import type { PaymentMethodType } from '../dto/create-payment.dto';
import { PaymentConfigService } from './payment-config.service';

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

/**
 * 建立付款服務
 *
 * 負責：
 * - 建立新的付款請求
 * - 重新生成付款表單
 * - 處理付款方式對應
 */
@Injectable()
export class CreatePaymentService {
  private readonly logger = new Logger(CreatePaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentConfig: PaymentConfigService,
  ) {}

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
    const { config, crypto } = this.paymentConfig.getEnabledContext();

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
      return this.regenerateFormData(existingPayment.id, paymentMethod);
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
    this.addPaymentMethodParams(tradeParams, paymentMethod, config);

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
   * 使用現有付款記錄重新生成表單
   */
  async regenerateFormData(
    paymentId: string,
    paymentMethod: PaymentMethodType = 'CREDIT',
  ): Promise<PaymentFormData> {
    const { config, crypto } = this.paymentConfig.getEnabledContext();

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

    // 重新建立完整的綠界交易參數
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
    this.addPaymentMethodParams(tradeParams, paymentMethod, config);

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
      STORE_CONTACT: 'CVS', // 到店取貨付款，使用超商付款流程
    };
    return map[method] || 'Credit';
  }

  /**
   * 加入付款方式專用參數
   */
  private addPaymentMethodParams(
    tradeParams: ECPayTradeParams,
    paymentMethod: PaymentMethodType,
    config: { paymentInfoUrl?: string },
  ): void {
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
  }

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
}
