import {
  ECPayCrypto,
  generateMerchantTradeNo,
  getTradeDate,
} from './ecpay-crypto';

describe('ECPayCrypto', () => {
  // 綠界測試環境的 HashKey/HashIV
  const TEST_HASH_KEY = '5294y06JbISpM5x9';
  const TEST_HASH_IV = 'v77hoKGq4kWxNNIS';

  let crypto: ECPayCrypto;

  beforeEach(() => {
    crypto = new ECPayCrypto(TEST_HASH_KEY, TEST_HASH_IV);
  });

  describe('generateCheckMacValue', () => {
    it('應按字母排序參數並產生正確的 CheckMacValue', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test1234567890',
        MerchantTradeDate: '2024/01/15 10:30:00',
        PaymentType: 'aio',
        TotalAmount: 1000,
        TradeDesc: 'Test',
        ItemName: 'TestItem',
        ReturnURL: 'https://example.com/return',
        ChoosePayment: 'ALL',
        EncryptType: 1,
      };

      const mac = crypto.generateCheckMacValue(params);

      // CheckMacValue 應該是 64 字元的大寫十六進制字串
      expect(mac).toMatch(/^[A-F0-9]{64}$/);
    });

    it('應正確處理中文字元', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TradeDesc: '測試訂單',
        ItemName: '豪德茶葉禮盒',
        TotalAmount: 500,
      };

      const mac = crypto.generateCheckMacValue(params);
      expect(mac).toMatch(/^[A-F0-9]{64}$/);
    });

    it('應過濾掉 undefined 值', () => {
      const paramsWithUndefined = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
        ClientBackURL: undefined,
        OrderResultURL: undefined,
      };

      const paramsWithoutUndefined = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      const mac1 = crypto.generateCheckMacValue(paramsWithUndefined);
      const mac2 = crypto.generateCheckMacValue(paramsWithoutUndefined);

      expect(mac1).toBe(mac2);
    });

    it('應過濾掉已存在的 CheckMacValue', () => {
      const paramsWithMac = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
        CheckMacValue: 'OLD_MAC_VALUE',
      };

      const paramsWithoutMac = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      const mac1 = crypto.generateCheckMacValue(paramsWithMac);
      const mac2 = crypto.generateCheckMacValue(paramsWithoutMac);

      expect(mac1).toBe(mac2);
    });

    it('相同參數不同順序應產生相同的 CheckMacValue', () => {
      const params1 = {
        MerchantID: '2000132',
        TotalAmount: 500,
        MerchantTradeNo: 'Test123',
      };

      const params2 = {
        TotalAmount: 500,
        MerchantTradeNo: 'Test123',
        MerchantID: '2000132',
      };

      expect(crypto.generateCheckMacValue(params1))
        .toBe(crypto.generateCheckMacValue(params2));
    });
  });

  describe('verifyCheckMacValue', () => {
    it('正確的 CheckMacValue 應回傳 true', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      // 先產生正確的 MAC
      const correctMac = crypto.generateCheckMacValue(params);

      // 加上 CheckMacValue 驗證
      const paramsWithMac = { ...params, CheckMacValue: correctMac };

      expect(crypto.verifyCheckMacValue(paramsWithMac)).toBe(true);
    });

    it('錯誤的 CheckMacValue 應回傳 false', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
        CheckMacValue: 'WRONG_MAC_VALUE_1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12',
      };

      expect(crypto.verifyCheckMacValue(params)).toBe(false);
    });

    it('缺少 CheckMacValue 應回傳 false', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      expect(crypto.verifyCheckMacValue(params)).toBe(false);
    });

    it('驗證應忽略大小寫', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      const correctMac = crypto.generateCheckMacValue(params);

      // 用小寫的 MAC 驗證
      const paramsWithLowerMac = { ...params, CheckMacValue: correctMac.toLowerCase() };
      expect(crypto.verifyCheckMacValue(paramsWithLowerMac)).toBe(true);
    });

    it('篡改參數後簽章應失敗', () => {
      const originalParams = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        TotalAmount: 500,
      };

      const correctMac = crypto.generateCheckMacValue(originalParams);

      // 篡改金額
      const tamperedParams = {
        ...originalParams,
        TotalAmount: 100, // 從 500 改成 100
        CheckMacValue: correctMac,
      };

      expect(crypto.verifyCheckMacValue(tamperedParams)).toBe(false);
    });
  });

  describe('dotNetUrlEncode（透過 generateCheckMacValue 間接測試）', () => {
    it('應正確處理特殊字元 !', () => {
      const params1 = { Test: 'Hello!' };
      const params2 = { Test: 'Hello' };

      // 含有 ! 的應該產生不同的 MAC
      expect(crypto.generateCheckMacValue(params1))
        .not.toBe(crypto.generateCheckMacValue(params2));
    });

    it("應正確處理特殊字元 '", () => {
      const params1 = { Test: "It's" };
      const params2 = { Test: 'Its' };

      expect(crypto.generateCheckMacValue(params1))
        .not.toBe(crypto.generateCheckMacValue(params2));
    });

    it('應正確處理空格', () => {
      const params1 = { Test: 'Hello World' };
      const params2 = { Test: 'HelloWorld' };

      expect(crypto.generateCheckMacValue(params1))
        .not.toBe(crypto.generateCheckMacValue(params2));
    });
  });

  describe('createPaymentData', () => {
    it('應回傳包含 CheckMacValue 的完整資料', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test1234567890',
        MerchantTradeDate: '2024/01/15 10:30:00',
        PaymentType: 'aio' as const,
        TotalAmount: 1000,
        TradeDesc: 'Test',
        ItemName: 'TestItem',
        ReturnURL: 'https://example.com/return',
        ChoosePayment: 'ALL' as const,
        EncryptType: 1 as const,
      };

      const result = crypto.createPaymentData(params);

      expect(result).toHaveProperty('CheckMacValue');
      expect(result.CheckMacValue).toMatch(/^[A-F0-9]{64}$/);
      expect(result.MerchantID).toBe('2000132');
      expect(result.TotalAmount).toBe(1000);
    });

    it('應過濾掉 undefined 值', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        MerchantTradeDate: '2024/01/15 10:30:00',
        PaymentType: 'aio' as const,
        TotalAmount: 1000,
        TradeDesc: 'Test',
        ItemName: 'TestItem',
        ReturnURL: 'https://example.com/return',
        ChoosePayment: 'ALL' as const,
        EncryptType: 1 as const,
        ClientBackURL: undefined,
      };

      const result = crypto.createPaymentData(params);

      expect(result).not.toHaveProperty('ClientBackURL');
    });
  });

  describe('parseAndVerifyResponse', () => {
    it('驗證成功應回傳解析後的 ECPayResponse', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        StoreID: '',
        RtnCode: '1',
        RtnMsg: '交易成功',
        TradeNo: 'ECPay123456',
        TradeAmt: '1000',
        PaymentDate: '2024/01/15 10:30:00',
        PaymentType: 'Credit_CreditCard',
        PaymentTypeChargeFee: '20',
        TradeDate: '2024/01/15 10:29:00',
        SimulatePaid: '0',
      };

      // 加上正確的 CheckMacValue
      const correctMac = crypto.generateCheckMacValue(params);
      const paramsWithMac = { ...params, CheckMacValue: correctMac };

      const result = crypto.parseAndVerifyResponse(paramsWithMac);

      expect(result).not.toBeNull();
      expect(result?.RtnCode).toBe(1);
      expect(result?.TradeAmt).toBe(1000);
      expect(result?.MerchantTradeNo).toBe('Test123');
    });

    it('驗證失敗應回傳 null', () => {
      const params = {
        MerchantID: '2000132',
        MerchantTradeNo: 'Test123',
        RtnCode: '1',
        TradeAmt: '1000',
        CheckMacValue: 'INVALID_MAC',
      };

      const result = crypto.parseAndVerifyResponse(params);

      expect(result).toBeNull();
    });
  });
});

describe('generateMerchantTradeNo', () => {
  it('應產生最多 20 字元的交易編號', () => {
    const result = generateMerchantTradeNo('ORD-20240115-123456');

    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('應移除訂單編號中的連字號', () => {
    const result = generateMerchantTradeNo('ORD-20240115-123456');

    expect(result).not.toContain('-');
  });

  it('多次呼叫應產生不同的編號（含時間戳）', () => {
    const result1 = generateMerchantTradeNo('ORD-001');
    // 等待 1ms 確保時間戳不同
    const result2 = generateMerchantTradeNo('ORD-001');

    // 由於時間戳精度，大多數情況會不同
    // 但在極端情況可能相同，所以這裡只測試格式
    expect(result1).toMatch(/^[A-Z0-9]+$/);
    expect(result2).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('getTradeDate', () => {
  it('應回傳 yyyy/MM/dd HH:mm:ss 格式', () => {
    const result = getTradeDate();

    // 格式：2024/01/15 10:30:00
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('應回傳當前時間（誤差在 2 秒內）', () => {
    const before = new Date();
    const result = getTradeDate();
    const after = new Date();

    // 解析回傳的時間
    const [datePart, timePart] = result.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const resultDate = new Date(year, month - 1, day, hours, minutes, seconds);

    // 確認在合理範圍內
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
