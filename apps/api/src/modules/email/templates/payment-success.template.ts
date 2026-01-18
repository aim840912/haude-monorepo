/**
 * Payment Success Email Template
 *
 * 付款成功郵件模板
 */

import {
  wrapInEmailTemplate,
  BRAND_COLORS,
  formatCurrency,
  getInfoCard,
  getCircleIcon,
} from './email-base.template';

export interface PaymentSuccessTemplateData {
  orderNumber: string;
  totalAmount: number;
  userName?: string;
}

/**
 * 產生付款成功郵件 HTML
 */
export function getPaymentSuccessTemplate(
  data: PaymentSuccessTemplateData,
): string {
  const { orderNumber, totalAmount, userName } = data;
  const name = userName || '顧客';

  const content = `
    ${getCircleIcon('<span style="color: #4caf50;">✓</span>', '#e8f5e9')}

    <div style="color: ${BRAND_COLORS.text}; text-align: center;">
      <h2 style="color: ${BRAND_COLORS.primary}; font-size: 24px; margin-bottom: 20px;">付款成功！</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        ${name} 您好，
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
        您的訂單付款已成功完成。
      </p>

      <!-- Order Info -->
      ${getInfoCard(`
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">訂單編號</p>
        <p style="margin: 0 0 20px; color: ${BRAND_COLORS.primary}; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center;">
          ${orderNumber}
        </p>
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">付款金額</p>
        <p style="margin: 0; color: ${BRAND_COLORS.text}; font-size: 28px; font-weight: bold; text-align: center;">
          ${formatCurrency(totalAmount)}
        </p>
      `)}

      <p style="font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
        我們將盡快為您準備商品並安排出貨。<br>
        出貨後您將收到物流追蹤通知。
      </p>

      <p style="font-size: 14px; color: ${BRAND_COLORS.textLight}; line-height: 1.6; margin-top: 30px;">
        預計出貨時間：1-3 個工作天
      </p>
    </div>
  `;

  return wrapInEmailTemplate({ content, title: '付款成功' });
}
