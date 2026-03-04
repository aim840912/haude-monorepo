/**
 * Password Reset Email Template
 *
 * 密碼重設郵件模板
 */

import { wrapInEmailTemplate, BRAND_COLORS, escapeHtml } from './email-base.template';

export interface PasswordResetTemplateData {
  resetUrl: string;
  userName?: string;
}

/**
 * 產生密碼重設郵件 HTML
 */
export function getPasswordResetTemplate(
  data: PasswordResetTemplateData,
): string {
  const { resetUrl, userName } = data;
  const name = escapeHtml(userName || '用戶');

  const content = `
    <div style="color: ${BRAND_COLORS.text};">
      <p style="font-size: 16px; margin-bottom: 20px;">
        ${name} 您好，
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        我們收到了您重設密碼的請求。請點擊下方按鈕來設定新密碼：
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block;
                  background-color: ${BRAND_COLORS.primary};
                  color: #ffffff;
                  text-decoration: none;
                  padding: 14px 40px;
                  border-radius: 6px;
                  font-size: 16px;
                  font-weight: 500;">
          重設密碼
        </a>
      </div>

      <p style="font-size: 14px; color: ${BRAND_COLORS.textMuted}; line-height: 1.6;">
        此連結將在 <strong>1 小時</strong>後失效。如果您沒有請求重設密碼，請忽略此郵件。
      </p>

      <p style="font-size: 14px; color: ${BRAND_COLORS.textMuted}; line-height: 1.6; margin-top: 20px;">
        如果按鈕無法點擊，請複製以下連結到瀏覽器：
      </p>
      <p style="font-size: 12px; color: ${BRAND_COLORS.textLight}; word-break: break-all; background-color: ${BRAND_COLORS.background}; padding: 10px; border-radius: 4px;">
        ${resetUrl}
      </p>
    </div>
  `;

  return wrapInEmailTemplate({ content, title: '重設密碼' });
}
