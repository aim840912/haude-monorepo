/**
 * Refund Notification Email Template
 *
 * 退款通知郵件模板
 */

import {
  wrapInEmailTemplate,
  BRAND_COLORS,
  formatCurrency,
  getInfoCard,
  getCircleIcon,
} from './email-base.template';

export interface RefundNotificationTemplateData {
  orderNumber: string;
  refundAmount: number;
  paymentType: string;
  userName?: string;
}

/**
 * 取得付款方式中文名稱
 */
function getPaymentTypeName(paymentType: string): string {
  switch (paymentType) {
    case 'CREDIT':
      return '信用卡';
    case 'ATM':
      return 'ATM 轉帳';
    case 'CVS':
      return '超商代碼';
    default:
      return paymentType;
  }
}

/**
 * 取得退款預計到帳時間
 */
function getRefundTimeEstimate(paymentType: string): string {
  switch (paymentType) {
    case 'CREDIT':
      return '退款將於 7-14 個工作天內退回您的信用卡帳戶。';
    case 'ATM':
      return '退款將匯入您的原付款帳戶，預計 3-5 個工作天到帳。';
    case 'CVS':
      return '退款將透過匯款方式退回，預計 3-5 個工作天到帳。';
    default:
      return '退款將於處理完成後退回您的帳戶。';
  }
}

/**
 * 產生退款通知郵件 HTML
 */
export function getRefundNotificationTemplate(
  data: RefundNotificationTemplateData,
): string {
  const { orderNumber, refundAmount, paymentType, userName } = data;
  const name = userName || '顧客';

  const content = `
    ${getCircleIcon('<span style="color: #1565c0;">&#8617;</span>', '#e3f2fd')}

    <div style="color: ${BRAND_COLORS.text}; text-align: center;">
      <h2 style="color: ${BRAND_COLORS.primary}; font-size: 24px; margin-bottom: 20px;">退款處理通知</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        ${name} 您好，
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
        您的訂單退款已處理完成。
      </p>

      <!-- Refund Info -->
      ${getInfoCard(`
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">訂單編號</p>
        <p style="margin: 0 0 20px; color: ${BRAND_COLORS.primary}; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center;">
          ${orderNumber}
        </p>
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">退款金額</p>
        <p style="margin: 0 0 20px; color: ${BRAND_COLORS.text}; font-size: 28px; font-weight: bold; text-align: center;">
          ${formatCurrency(refundAmount)}
        </p>
        <p style="margin: 0; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">
          付款方式：${getPaymentTypeName(paymentType)}
        </p>
      `)}

      <p style="font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
        ${getRefundTimeEstimate(paymentType)}
      </p>

      <p style="font-size: 14px; color: ${BRAND_COLORS.textLight}; line-height: 1.6; margin-top: 30px;">
        如有任何疑問，請聯繫我們的客服團隊。
      </p>
    </div>
  `;

  return wrapInEmailTemplate({ content, title: '退款處理通知' });
}
