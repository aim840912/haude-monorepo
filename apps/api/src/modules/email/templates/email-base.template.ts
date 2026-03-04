/**
 * Base Email Template
 *
 * 提供統一的郵件基礎結構和樣式
 */

/**
 * Escape HTML special characters in user-controlled strings to prevent HTML injection.
 * Must be applied to all user-supplied data inserted into email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailBaseOptions {
  content: string;
  title?: string;
}

/**
 * 品牌顏色
 */
export const BRAND_COLORS = {
  primary: '#4a7c59',
  background: '#f5f5f0',
  text: '#333',
  textMuted: '#666',
  textLight: '#888',
  textLighter: '#999',
  border: '#eee',
  success: '#4caf50',
  error: '#e53935',
} as const;

/**
 * 取得品牌 Header HTML
 */
export function getBrandHeader(): string {
  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: ${BRAND_COLORS.primary}; font-size: 24px; margin: 0;">豪德製茶所</h1>
      <p style="color: ${BRAND_COLORS.textLight}; font-size: 14px; margin-top: 5px;">HAUDE TEA</p>
    </div>
  `;
}

/**
 * 取得郵件 Footer HTML
 */
export function getEmailFooter(): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid ${BRAND_COLORS.border}; text-align: center;">
      <p style="font-size: 12px; color: ${BRAND_COLORS.textLighter}; margin: 0;">
        此郵件由系統自動發送，請勿直接回覆。
      </p>
      <p style="font-size: 12px; color: ${BRAND_COLORS.textLighter}; margin-top: 10px;">
        &copy; ${new Date().getFullYear()} 豪德製茶所 Haude Tea
      </p>
    </div>
  `;
}

/**
 * 包裝郵件內容於基礎模板中
 */
export function wrapInEmailTemplate(options: EmailBaseOptions): string {
  const { content, title = '' } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getBrandHeader()}
        ${content}
        ${getEmailFooter()}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 格式化金額顯示
 */
export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`;
}

/**
 * 取得資訊卡片 HTML
 */
export function getInfoCard(children: string): string {
  return `
    <div style="background-color: ${BRAND_COLORS.background}; border-radius: 8px; padding: 20px; margin: 20px 0;">
      ${children}
    </div>
  `;
}

/**
 * 取得圓形圖示 HTML
 */
export function getCircleIcon(icon: string, backgroundColor: string): string {
  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: ${backgroundColor}; border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">${icon}</span>
      </div>
    </div>
  `;
}
