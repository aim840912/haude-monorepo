/**
 * 綠界 ECPay 金流加解密工具
 *
 * 綠界使用 SHA256 產生 CheckMacValue 驗證碼
 *
 * CheckMacValue 產生流程：
 * 1. 將參數依照字母 A-Z 排序
 * 2. 用 & 串連所有參數
 * 3. 前面加 HashKey=xxx&，後面加 &HashIV=xxx
 * 4. URL encode (轉小寫)
 * 5. SHA256 加密後轉大寫
 *
 * @see https://developers.ecpay.com.tw/
 */

import * as crypto from 'crypto';

export interface ECPayConfig {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  apiUrl: string;
  returnUrl: string;
  notifyUrl: string;
  clientBackUrl?: string;
  paymentInfoUrl?: string; // ATM/CVS 取號結果回調
}

/**
 * 綠界 AioCheckOut 必要參數
 */
export interface ECPayTradeParams {
  MerchantID: string;
  MerchantTradeNo: string;
  MerchantTradeDate: string;
  PaymentType: 'aio';
  TotalAmount: number;
  TradeDesc: string;
  ItemName: string;
  ReturnURL: string;
  ChoosePayment: 'Credit' | 'WebATM' | 'ATM' | 'CVS' | 'BARCODE' | 'ALL';
  EncryptType: 1;
  // 選填參數
  ClientBackURL?: string;
  OrderResultURL?: string;
  NeedExtraPaidInfo?: 'Y' | 'N';
  // ATM 專用參數
  ExpireDate?: number; // 繳費期限（天數，1-60）
  PaymentInfoURL?: string; // 取號結果回調 URL
  // CVS 專用參數
  StoreExpireDate?: number; // 繳費期限（分鐘，1-43200）
  Desc_1?: string; // 交易描述 1
  Desc_2?: string; // 交易描述 2
  Desc_3?: string; // 交易描述 3
  Desc_4?: string; // 交易描述 4
  // Index signature for dynamic access
  [key: string]: string | number | undefined;
}

/**
 * 綠界回傳結果
 */
export interface ECPayResponse {
  MerchantID: string;
  MerchantTradeNo: string;
  StoreID: string;
  RtnCode: number;
  RtnMsg: string;
  TradeNo: string;
  TradeAmt: number;
  PaymentDate: string;
  PaymentType: string;
  PaymentTypeChargeFee: number;
  TradeDate: string;
  SimulatePaid: number;
  CheckMacValue: string;
}

/**
 * 綠界金流加解密工具類別
 */
export class ECPayCrypto {
  private readonly hashKey: string;
  private readonly hashIv: string;

  constructor(hashKey: string, hashIv: string) {
    this.hashKey = hashKey;
    this.hashIv = hashIv;
  }

  /**
   * 產生 CheckMacValue
   *
   * 步驟：
   * 1. 參數按字母排序
   * 2. 用 & 串連
   * 3. 前後加上 HashKey 和 HashIV
   * 4. URL encode 後轉小寫
   * 5. SHA256 加密後轉大寫
   */
  generateCheckMacValue(params: Record<string, string | number | undefined>): string {
    // 1. 過濾掉 undefined 和 CheckMacValue
    const filteredParams = Object.entries(params)
      .filter(([key, value]) => value !== undefined && key !== 'CheckMacValue')
      .reduce((acc, [key, value]) => {
        acc[key] = value!;
        return acc;
      }, {} as Record<string, string | number>);

    // 2. 按字母排序
    const sortedKeys = Object.keys(filteredParams).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // 3. 組成 query string
    const queryString = sortedKeys
      .map((key) => `${key}=${filteredParams[key]}`)
      .join('&');

    // 4. 前後加上 HashKey 和 HashIV
    const raw = `HashKey=${this.hashKey}&${queryString}&HashIV=${this.hashIv}`;

    // 5. URL encode 並轉小寫（使用綠界的特殊編碼規則）
    const encoded = this.dotNetUrlEncode(raw).toLowerCase();

    // 6. SHA256 加密後轉大寫
    return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
  }

  /**
   * 驗證 CheckMacValue
   */
  verifyCheckMacValue(params: Record<string, string | number | undefined>): boolean {
    const receivedMac = params.CheckMacValue as string;
    if (!receivedMac) return false;

    const calculatedMac = this.generateCheckMacValue(params);
    return calculatedMac === receivedMac.toUpperCase();
  }

  /**
   * .NET 相容的 URL encode
   *
   * 綠界使用 .NET 的 Server.UrlEncode，需要特殊處理某些字元
   */
  private dotNetUrlEncode(str: string): string {
    // 先做標準 URL encode
    let encoded = encodeURIComponent(str);

    // .NET 的特殊編碼規則
    encoded = encoded
      .replace(/\!/g, '%21')
      .replace(/\'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+');

    return encoded;
  }

  /**
   * 建立付款表單資料
   */
  createPaymentData(
    params: ECPayTradeParams,
  ): Record<string, string | number> {
    const checkMacValue = this.generateCheckMacValue(params);

    // 過濾掉 undefined 值並返回乾淨的 Record
    const result: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    result.CheckMacValue = checkMacValue;

    return result;
  }

  /**
   * 解析並驗證綠界回傳
   */
  parseAndVerifyResponse(body: Record<string, string>): ECPayResponse | null {
    // 驗證 CheckMacValue
    if (!this.verifyCheckMacValue(body)) {
      return null;
    }

    return {
      MerchantID: body.MerchantID,
      MerchantTradeNo: body.MerchantTradeNo,
      StoreID: body.StoreID || '',
      RtnCode: parseInt(body.RtnCode, 10),
      RtnMsg: body.RtnMsg,
      TradeNo: body.TradeNo,
      TradeAmt: parseInt(body.TradeAmt, 10),
      PaymentDate: body.PaymentDate,
      PaymentType: body.PaymentType,
      PaymentTypeChargeFee: parseFloat(body.PaymentTypeChargeFee) || 0,
      TradeDate: body.TradeDate,
      SimulatePaid: parseInt(body.SimulatePaid, 10) || 0,
      CheckMacValue: body.CheckMacValue,
    };
  }
}

/**
 * 產生綠界交易編號
 *
 * 格式：前綴 + 時間戳 + 隨機數（最多 20 字元）
 */
export function generateMerchantTradeNo(orderNumber: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const shortOrderNo = orderNumber.replace(/-/g, '').slice(0, 10);
  return `${shortOrderNo}${timestamp}`.slice(0, 20);
}

/**
 * 取得綠界格式的交易時間
 *
 * 格式：yyyy/MM/dd HH:mm:ss
 */
export function getTradeDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
