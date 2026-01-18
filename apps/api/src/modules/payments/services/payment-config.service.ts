import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ECPayCrypto, ECPayConfig } from '../utils/ecpay-crypto';

/**
 * ECPay 配置管理服務
 *
 * 負責：
 * - 載入和驗證 ECPay 配置
 * - 提供配置和加密工具給其他服務
 * - 管理支付功能啟用狀態
 */
@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);
  private readonly crypto: ECPayCrypto | null = null;
  private readonly config: ECPayConfig | null = null;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
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
   * 檢查支付服務是否可用
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 取得 ECPay 配置
   * @throws BadRequestException 如果支付服務未啟用
   */
  getConfig(): ECPayConfig {
    if (!this.isEnabled || !this.config) {
      throw new BadRequestException(
        '支付功能尚未啟用，請聯繫管理員設定支付配置',
      );
    }
    return this.config;
  }

  /**
   * 取得 ECPay 加密工具
   * @throws BadRequestException 如果支付服務未啟用
   */
  getCrypto(): ECPayCrypto {
    if (!this.isEnabled || !this.crypto) {
      throw new BadRequestException(
        '支付功能尚未啟用，請聯繫管理員設定支付配置',
      );
    }
    return this.crypto;
  }

  /**
   * 驗證支付服務已啟用並回傳配置和加密工具
   * @throws BadRequestException 如果支付服務未啟用
   */
  getEnabledContext(): { config: ECPayConfig; crypto: ECPayCrypto } {
    return {
      config: this.getConfig(),
      crypto: this.getCrypto(),
    };
  }
}
