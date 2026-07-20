/**
 * 金流原始 payload 遮罩
 *
 * 背景：ECPay 回調（`NeedExtraPaidInfo: 'Y'`）會帶回虛擬帳號、信用卡前六後四、
 * 超商繳費代碼等資料。這些值本身已存進 Payment 的結構化欄位（vaAccount、
 * paymentCode…）供業務流程使用；再把原始 JSON 整包存進 requestData /
 * responseData / rawData 等於留下第二份未受控的副本。
 *
 * 策略：結構化欄位不動（客戶要靠 vaAccount 去繳費），只對「稽核用的原始
 * JSON 備份」做遮罩，符合個資最小蒐集原則。
 */

/** 完全移除（對帳無用，且屬敏感資料） */
const DROP_KEYS = new Set(
  ['CheckMacValue', 'CardInfo', 'card_no', 'CardNo'].map((k) =>
    k.toLowerCase(),
  ),
);

/** 保留末 4 碼，其餘以 * 取代 */
const PARTIAL_KEYS = new Set(
  [
    'vAccount',
    'vaAccount',
    'card4no',
    'card6no',
    'Card4No',
    'Card6No',
    'PaymentNo',
    'Barcode1',
    'Barcode2',
    'Barcode3',
  ].map((k) => k.toLowerCase()),
);

/** 商店端憑證，不需留在每一筆稽核記錄裡 */
const REDACT_KEYS = new Set(
  ['MerchantID', 'HashKey', 'HashIV'].map((k) => k.toLowerCase()),
);

function maskTail(value: string, keep = 4): string {
  const s = String(value);
  if (s.length <= keep) return '*'.repeat(s.length);
  return '*'.repeat(s.length - keep) + s.slice(-keep);
}

/**
 * 遞迴遮罩物件中的敏感欄位。
 * - 不修改傳入物件（回傳新物件）
 * - 非物件值原樣回傳
 */
export function maskPaymentPayload<T>(payload: T): T {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) {
    // 明確標註為 unknown[]：Array.isArray 會把泛型 T narrow 成 any[]，
    // 導致 .map() 回傳 any（觸發 no-unsafe-return）
    return (payload as unknown[]).map((item) =>
      maskPaymentPayload(item),
    ) as unknown as T;
  }
  if (typeof payload !== 'object') return payload;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    payload as Record<string, unknown>,
  )) {
    const k = key.toLowerCase();

    if (DROP_KEYS.has(k)) continue;

    if (REDACT_KEYS.has(k)) {
      out[key] = '[REDACTED]';
      continue;
    }

    if (
      PARTIAL_KEYS.has(k) &&
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      out[key] = maskTail(value as string);
      continue;
    }

    out[key] =
      value !== null && typeof value === 'object'
        ? maskPaymentPayload(value)
        : value;
  }

  return out as unknown as T;
}
