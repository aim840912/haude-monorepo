/**
 * 藍新金流加解密工具
 *
 * 藍新使用 AES-256-CBC 加密交易資訊，並用 SHA256 生成驗證簽章
 *
 * 加密流程：
 * 1. 將交易參數組成 query string
 * 2. AES-256-CBC 加密 → TradeInfo
 * 3. SHA256(HashKey + TradeInfo + HashIV) → TradeSha
 *
 * 解密流程：
 * 1. 驗證 TradeSha
 * 2. AES-256-CBC 解密 TradeInfo
 * 3. 解析 query string 或 JSON
 */

import * as crypto from 'crypto';

export interface NewebPayConfig {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  apiUrl: string;
  notifyUrl: string;
  returnUrl: string;
  version?: string;
}

export interface TradeInfoParams {
  MerchantID: string;
  RespondType: 'JSON' | 'String';
  TimeStamp: string;
  Version: string;
  MerchantOrderNo: string;
  Amt: number;
  ItemDesc: string;
  Email?: string;
  ReturnURL?: string;
  NotifyURL?: string;
  ClientBackURL?: string;
  // 信用卡專用
  CREDIT?: 1;
  InstFlag?: 0 | 1;
  // ATM 虛擬帳號
  VACC?: 1;
  // 超商代碼
  CVS?: 1;
  // 超商條碼
  BARCODE?: 1;
  // Index signature for dynamic access
  [key: string]: string | number | undefined;
}

export interface NewebPayResponse {
  Status: string;
  Message: string;
  Result?: {
    MerchantID: string;
    Amt: number;
    TradeNo: string;
    MerchantOrderNo: string;
    PaymentType: string;
    RespondType: string;
    PayTime: string;
    IP: string;
    EscrowBank: string;
    // 信用卡專用
    Card6No?: string;
    Card4No?: string;
    AuthBank?: string;
    AuthCode?: string;
  };
}

/**
 * 藍新金流加解密工具類別
 */
export class NewebPayCrypto {
  private readonly hashKey: string;
  private readonly hashIv: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(hashKey: string, hashIv: string) {
    this.hashKey = hashKey;
    this.hashIv = hashIv;
  }

  /**
   * AES-256-CBC 加密
   *
   * @param data - 要加密的資料（query string 格式）
   * @returns 加密後的 hex 字串
   */
  encrypt(data: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.hashKey,
      this.hashIv,
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  /**
   * AES-256-CBC 解密
   *
   * @param encryptedData - 加密的 hex 字串
   * @returns 解密後的原始資料
   */
  decrypt(encryptedData: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.hashKey,
      this.hashIv,
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 生成 TradeSha 簽章
   *
   * SHA256 雜湊格式：HashKey=xxx&TradeInfo&HashIV=xxx
   *
   * @param tradeInfo - 加密後的 TradeInfo
   * @returns 大寫的 SHA256 hex 字串
   */
  generateTradeSha(tradeInfo: string): string {
    const raw = `HashKey=${this.hashKey}&${tradeInfo}&HashIV=${this.hashIv}`;
    return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  }

  /**
   * 驗證 TradeSha 簽章
   *
   * @param tradeInfo - 加密的 TradeInfo
   * @param receivedSha - 收到的 TradeSha
   * @returns 是否驗證通過
   */
  verifyTradeSha(tradeInfo: string, receivedSha: string): boolean {
    const expectedSha = this.generateTradeSha(tradeInfo);
    return expectedSha === receivedSha.toUpperCase();
  }

  /**
   * 將參數物件轉換為 query string 格式
   *
   * @param params - 參數物件
   * @returns query string 格式的字串
   */
  static paramsToQueryString(params: Record<string, unknown>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}`,
      )
      .join('&');
  }

  /**
   * 解析 query string 為物件
   *
   * @param queryString - query string 格式的字串
   * @returns 解析後的物件
   */
  static parseQueryString(queryString: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[key] = decodeURIComponent(value?.replace(/\+/g, ' ') || '');
      }
    }

    return result;
  }

  /**
   * 建立完整的付款表單資料
   *
   * @param params - 交易參數
   * @param config - 藍新配置
   * @returns 表單提交所需的資料
   */
  createPaymentData(
    params: TradeInfoParams,
    config: Pick<NewebPayConfig, 'merchantId' | 'version'>,
  ): {
    MerchantID: string;
    TradeInfo: string;
    TradeSha: string;
    Version: string;
  } {
    // 1. 將參數轉為 query string
    const queryString = NewebPayCrypto.paramsToQueryString(params);

    // 2. AES 加密
    const tradeInfo = this.encrypt(queryString);

    // 3. 生成 SHA256 簽章
    const tradeSha = this.generateTradeSha(tradeInfo);

    return {
      MerchantID: config.merchantId,
      TradeInfo: tradeInfo,
      TradeSha: tradeSha,
      Version: config.version || '2.0',
    };
  }

  /**
   * 解密並解析藍新回調資料
   *
   * @param tradeInfo - 加密的 TradeInfo
   * @param tradeSha - TradeSha 簽章
   * @returns 解密後的回應資料，驗證失敗則返回 null
   */
  decryptResponse(
    tradeInfo: string,
    tradeSha: string,
  ): NewebPayResponse | null {
    // 1. 驗證簽章
    if (!this.verifyTradeSha(tradeInfo, tradeSha)) {
      return null;
    }

    // 2. 解密
    const decrypted = this.decrypt(tradeInfo);

    // 3. 解析（藍新回傳 JSON 格式）
    try {
      return JSON.parse(decrypted) as NewebPayResponse;
    } catch {
      // 如果不是 JSON，嘗試解析 query string
      const parsed = NewebPayCrypto.parseQueryString(decrypted);
      return {
        Status: parsed.Status || '',
        Message: parsed.Message || '',
        Result: parsed as unknown as NewebPayResponse['Result'],
      };
    }
  }
}

/**
 * 生成商店訂單編號
 *
 * 格式：訂單編號去除橫線 + 時間戳（最多 30 字元）
 *
 * @param orderNumber - 訂單編號
 * @returns 商店訂單編號
 */
export function generateMerchantOrderNo(orderNumber: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const shortOrderNo = orderNumber.replace(/-/g, '').slice(0, 20);
  return `${shortOrderNo}${timestamp}`.slice(0, 30);
}

/**
 * 取得當前時間戳（秒）
 */
export function getTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}
