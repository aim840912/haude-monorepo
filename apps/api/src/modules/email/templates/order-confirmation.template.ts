/**
 * Order Confirmation Email Template
 *
 * 訂單確認郵件模板
 */

import {
  wrapInEmailTemplate,
  BRAND_COLORS,
  formatCurrency,
  getInfoCard,
} from './email-base.template';
import type { OrderEmailData } from '../types';
import { getPaymentMethodText } from '../types';

export interface OrderConfirmationTemplateData {
  order: OrderEmailData;
  userName?: string;
}

/**
 * 產生訂單確認郵件 HTML
 */
export function getOrderConfirmationTemplate(
  data: OrderConfirmationTemplateData,
): string {
  const { order, userName } = data;
  const name = userName || '顧客';
  const paymentMethodText = getPaymentMethodText(order.paymentMethod);

  // 建立商品明細 HTML
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `,
    )
    .join('');

  // 折扣金額 HTML（如果有的話）
  const discountHtml = order.discountAmount
    ? `
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: ${BRAND_COLORS.error};">折扣優惠</td>
          <td style="padding: 8px 12px; text-align: right; color: ${BRAND_COLORS.error};">-${formatCurrency(order.discountAmount)}</td>
        </tr>
      `
    : '';

  const content = `
    <div style="color: ${BRAND_COLORS.text};">
      <p style="font-size: 16px; margin-bottom: 20px;">
        ${name} 您好，
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
        感謝您的訂購！您的訂單已成功建立。
      </p>

      <!-- Order Number -->
      ${getInfoCard(`
        <p style="margin: 0; color: ${BRAND_COLORS.textMuted}; font-size: 14px; text-align: center;">訂單編號</p>
        <p style="margin: 10px 0 0; color: ${BRAND_COLORS.primary}; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center;">
          ${order.orderNumber}
        </p>
      `)}

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: ${BRAND_COLORS.background};">
            <th style="padding: 12px; text-align: left; font-weight: 600;">商品名稱</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">數量</th>
            <th style="padding: 12px; text-align: right; font-weight: 600;">單價</th>
            <th style="padding: 12px; text-align: right; font-weight: 600;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right;">商品小計</td>
            <td style="padding: 8px 12px; text-align: right;">${formatCurrency(order.subtotal)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right;">運費</td>
            <td style="padding: 8px 12px; text-align: right;">${formatCurrency(order.shippingFee)}</td>
          </tr>
          ${discountHtml}
          <tr style="font-weight: bold; font-size: 18px;">
            <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid ${BRAND_COLORS.primary};">總計</td>
            <td style="padding: 12px; text-align: right; border-top: 2px solid ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.primary};">${formatCurrency(order.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Shipping Address -->
      ${getInfoCard(`
        <h3 style="margin: 0 0 15px; color: ${BRAND_COLORS.text}; font-size: 16px;">收件資訊</h3>
        <p style="margin: 5px 0; color: ${BRAND_COLORS.textMuted};"><strong>收件人：</strong>${order.shippingAddress.name}</p>
        <p style="margin: 5px 0; color: ${BRAND_COLORS.textMuted};"><strong>電話：</strong>${order.shippingAddress.phone}</p>
        <p style="margin: 5px 0; color: ${BRAND_COLORS.textMuted};"><strong>地址：</strong>${order.shippingAddress.address}</p>
        <p style="margin: 5px 0; color: ${BRAND_COLORS.textMuted};"><strong>付款方式：</strong>${paymentMethodText}</p>
      `)}

      <p style="font-size: 14px; color: ${BRAND_COLORS.textMuted}; line-height: 1.6; margin-top: 20px;">
        如有任何問題，請聯繫我們的客服團隊。
      </p>
    </div>
  `;

  return wrapInEmailTemplate({ content, title: '訂單確認' });
}
