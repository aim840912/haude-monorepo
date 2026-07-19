import { maskPaymentPayload } from './mask-payment-payload';

describe('maskPaymentPayload', () => {
  it('保留對帳必要欄位不變', () => {
    const body = {
      MerchantTradeNo: 'HD20260720001',
      TradeNo: 'EC-ATM-123',
      RtnCode: '1',
      RtnMsg: '交易成功',
      TradeAmt: '3200',
      PaymentDate: '2026/07/20 01:23:45',
      PaymentType: 'ATM_TAISHIN',
      BankCode: '812',
    };

    expect(maskPaymentPayload(body)).toEqual(body);
  });

  it('虛擬帳號只保留末 4 碼', () => {
    const out = maskPaymentPayload({ vAccount: '1234567890123456' });
    expect(out.vAccount).toBe('************3456');
  });

  it('信用卡前六後四遮罩', () => {
    const out = maskPaymentPayload({ card6no: '431195', card4no: '1234' });
    expect(out.card6no).toBe('**1195');
    expect(out.card4no).toBe('****');
  });

  it('移除 CheckMacValue 與完整卡號', () => {
    const out = maskPaymentPayload({
      MerchantTradeNo: 'X',
      CheckMacValue: 'ABCDEF0123456789',
      CardNo: '4311951234567890',
    });
    expect(out).not.toHaveProperty('CheckMacValue');
    expect(out).not.toHaveProperty('CardNo');
    expect(out.MerchantTradeNo).toBe('X');
  });

  it('商店識別碼改為 REDACTED', () => {
    const out = maskPaymentPayload({ MerchantID: '3002607', HashKey: 'abc' });
    expect(out.MerchantID).toBe('[REDACTED]');
    expect(out.HashKey).toBe('[REDACTED]');
  });

  it('欄位名稱大小寫不敏感', () => {
    const out = maskPaymentPayload({ VACCOUNT: '9876543210', Card4No: '4321' });
    expect(out.VACCOUNT).toBe('******3210');
    expect(out.Card4No).toBe('****');
  });

  it('遞迴處理巢狀物件與陣列', () => {
    const out = maskPaymentPayload({
      outer: { vAccount: '1111222233334444' },
      list: [{ card4no: '9999' }],
    });
    expect(out.outer.vAccount).toBe('************4444');
    expect(out.list[0].card4no).toBe('****');
  });

  it('不修改原始物件', () => {
    const original = { vAccount: '1234567890123456' };
    maskPaymentPayload(original);
    expect(original.vAccount).toBe('1234567890123456');
  });

  it('容忍 null / undefined / 空字串', () => {
    expect(maskPaymentPayload(null)).toBeNull();
    expect(maskPaymentPayload(undefined)).toBeUndefined();
    expect(maskPaymentPayload({ vAccount: '' }).vAccount).toBe('');
  });
});
