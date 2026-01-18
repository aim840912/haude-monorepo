/**
 * Shipping Notification Email Template
 *
 * 發貨通知郵件模板
 */

import {
  wrapInEmailTemplate,
  BRAND_COLORS,
  getInfoCard,
  getCircleIcon,
} from './email-base.template';

export interface ShippingNotificationTemplateData {
  orderNumber: string;
  trackingNumber: string;
  userName?: string;
}

/**
 * 產生發貨通知郵件 HTML
 */
export function getShippingNotificationTemplate(
  data: ShippingNotificationTemplateData,
): string {
  const { orderNumber, trackingNumber, userName } = data;
  const name = userName || '顧客';

  const content = `
    ${getCircleIcon('📦', '#e3f2fd')}

    <div style="color: ${BRAND_COLORS.text}; text-align: center;">
      <h2 style="color: ${BRAND_COLORS.primary}; font-size: 24px; margin-bottom: 20px;">您的訂單已出貨！</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        ${name} 您好，
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
        好消息！您的訂單已經出貨，正在送往您指定的地址。
      </p>

      <!-- Order Info -->
      ${getInfoCard(`
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">訂單編號</p>
        <p style="margin: 0 0 20px; color: ${BRAND_COLORS.primary}; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-align: center;">
          ${orderNumber}
        </p>
        <p style="margin: 0 0 10px; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">物流追蹤號碼</p>
        <p style="margin: 0; color: ${BRAND_COLORS.text}; font-size: 20px; font-weight: bold; letter-spacing: 1px; text-align: center;">
          ${trackingNumber}
        </p>
      `)}

      <p style="font-size: 14px; color: ${BRAND_COLORS.textMuted}; line-height: 1.6;">
        您可以使用上方的追蹤號碼，<br>
        在物流公司網站查詢配送進度。
      </p>

      <p style="font-size: 14px; color: ${BRAND_COLORS.textLight}; line-height: 1.6; margin-top: 30px;">
        預計配送時間：2-5 個工作天<br>
        （實際時間依配送地區而定）
      </p>
    </div>
  `;

  return wrapInEmailTemplate({ content, title: '訂單已出貨' });
}
