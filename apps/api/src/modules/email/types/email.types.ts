/**
 * Email Module Types
 *
 * 郵件服務的共用型別定義
 */

/**
 * 訂單商品資訊
 */
export interface OrderItemInfo {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * 訂單郵件資訊
 */
export interface OrderEmailData {
  orderNumber: string;
  items: OrderItemInfo[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
  paymentMethod?: string;
}

/**
 * 郵件發送參數
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * 付款方式對應文字
 */
export const PAYMENT_METHOD_TEXT: Record<string, string> = {
  credit_card: '信用卡',
  CREDIT: '信用卡',
  atm: 'ATM 轉帳',
  ATM: 'ATM 轉帳',
  cvs: '超商付款',
  CVS: '超商付款',
};

/**
 * 取得付款方式文字
 */
export function getPaymentMethodText(method?: string): string {
  return PAYMENT_METHOD_TEXT[method || ''] || '線上付款';
}
