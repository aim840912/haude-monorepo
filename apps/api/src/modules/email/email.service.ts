import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@haude.com';
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userName?: string,
  ): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: `豪德製茶所 <${this.fromEmail}>`,
        to: [to],
        subject: '重設您的密碼 - 豪德製茶所',
        html: this.getPasswordResetTemplate(resetUrl, userName),
      });

      if (error) {
        this.logger.error(`發送郵件失敗: ${error.message}`);
        return false;
      }

      this.logger.log(`密碼重設郵件已發送至 ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`發送郵件時發生錯誤: ${error}`);
      return false;
    }
  }

  /**
   * 密碼重設郵件模板
   */
  private getPasswordResetTemplate(resetUrl: string, userName?: string): string {
    const name = userName || '用戶';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重設密碼</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Logo / Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4a7c59; font-size: 24px; margin: 0;">豪德製茶所</h1>
          <p style="color: #888; font-size: 14px; margin-top: 5px;">HAUDE TEA</p>
        </div>

        <!-- Content -->
        <div style="color: #333;">
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
                      background-color: #4a7c59;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 14px 40px;
                      border-radius: 6px;
                      font-size: 16px;
                      font-weight: 500;">
              重設密碼
            </a>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            此連結將在 <strong>1 小時</strong>後失效。如果您沒有請求重設密碼，請忽略此郵件。
          </p>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
            如果按鈕無法點擊，請複製以下連結到瀏覽器：
          </p>
          <p style="font-size: 12px; color: #888; word-break: break-all; background-color: #f5f5f0; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            此郵件由系統自動發送，請勿直接回覆。
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            &copy; ${new Date().getFullYear()} 豪德製茶所 Haude Tea
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
