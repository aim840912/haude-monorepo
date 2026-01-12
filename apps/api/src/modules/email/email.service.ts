import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

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

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.isEnabled = !!apiKey;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized');
    } else {
      this.logger.warn(
        'RESEND_API_KEY not configured - email service disabled',
      );
    }

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
    if (!this.isEnabled || !this.resend) {
      this.logger.warn(`Email service disabled - skipping email to ${to}`);
      return false;
    }

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

  // ========================================
  // 訂單郵件
  // ========================================

  /**
   * 發送訂單確認郵件
   */
  async sendOrderConfirmationEmail(
    to: string,
    order: OrderEmailData,
    userName?: string,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.resend) {
      this.logger.warn(`Email service disabled - skipping email to ${to}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `豪德製茶所 <${this.fromEmail}>`,
        to: [to],
        subject: `訂單確認 #${order.orderNumber} - 豪德製茶所`,
        html: this.getOrderConfirmationTemplate(order, userName),
      });

      if (error) {
        this.logger.error(`發送訂單確認郵件失敗: ${error.message}`);
        return false;
      }

      this.logger.log(`訂單確認郵件已發送至 ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`發送訂單確認郵件時發生錯誤: ${error}`);
      return false;
    }
  }

  /**
   * 發送支付成功郵件
   */
  async sendPaymentSuccessEmail(
    to: string,
    orderNumber: string,
    totalAmount: number,
    userName?: string,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.resend) {
      this.logger.warn(`Email service disabled - skipping email to ${to}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `豪德製茶所 <${this.fromEmail}>`,
        to: [to],
        subject: `付款成功 #${orderNumber} - 豪德製茶所`,
        html: this.getPaymentSuccessTemplate(orderNumber, totalAmount, userName),
      });

      if (error) {
        this.logger.error(`發送支付成功郵件失敗: ${error.message}`);
        return false;
      }

      this.logger.log(`支付成功郵件已發送至 ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`發送支付成功郵件時發生錯誤: ${error}`);
      return false;
    }
  }

  /**
   * 發送發貨通知郵件
   */
  async sendShippingNotificationEmail(
    to: string,
    orderNumber: string,
    trackingNumber: string,
    userName?: string,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.resend) {
      this.logger.warn(`Email service disabled - skipping email to ${to}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `豪德製茶所 <${this.fromEmail}>`,
        to: [to],
        subject: `您的訂單已出貨 #${orderNumber} - 豪德製茶所`,
        html: this.getShippingNotificationTemplate(orderNumber, trackingNumber, userName),
      });

      if (error) {
        this.logger.error(`發送發貨通知郵件失敗: ${error.message}`);
        return false;
      }

      this.logger.log(`發貨通知郵件已發送至 ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`發送發貨通知郵件時發生錯誤: ${error}`);
      return false;
    }
  }

  // ========================================
  // 郵件模板
  // ========================================

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

  /**
   * 訂單確認郵件模板
   */
  private getOrderConfirmationTemplate(order: OrderEmailData, userName?: string): string {
    const name = userName || '顧客';
    const paymentMethodText = this.getPaymentMethodText(order.paymentMethod);

    // 建立商品明細 HTML
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">NT$ ${item.unitPrice.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">NT$ ${item.subtotal.toLocaleString()}</td>
        </tr>
      `,
      )
      .join('');

    // 折扣金額 HTML（如果有的話）
    const discountHtml = order.discountAmount
      ? `
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #e53935;">折扣優惠</td>
          <td style="padding: 8px 12px; text-align: right; color: #e53935;">-NT$ ${order.discountAmount.toLocaleString()}</td>
        </tr>
      `
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>訂單確認</title>
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

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
            感謝您的訂購！您的訂單已成功建立。
          </p>

          <!-- Order Number -->
          <div style="background-color: #f5f5f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">訂單編號</p>
            <p style="margin: 10px 0 0; color: #4a7c59; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${order.orderNumber}
            </p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f0;">
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
                <td style="padding: 8px 12px; text-align: right;">NT$ ${order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px 12px; text-align: right;">運費</td>
                <td style="padding: 8px 12px; text-align: right;">NT$ ${order.shippingFee.toLocaleString()}</td>
              </tr>
              ${discountHtml}
              <tr style="font-weight: bold; font-size: 18px;">
                <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid #4a7c59;">總計</td>
                <td style="padding: 12px; text-align: right; border-top: 2px solid #4a7c59; color: #4a7c59;">NT$ ${order.totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Shipping Address -->
          <div style="background-color: #f5f5f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">收件資訊</h3>
            <p style="margin: 5px 0; color: #666;"><strong>收件人：</strong>${order.shippingAddress.name}</p>
            <p style="margin: 5px 0; color: #666;"><strong>電話：</strong>${order.shippingAddress.phone}</p>
            <p style="margin: 5px 0; color: #666;"><strong>地址：</strong>${order.shippingAddress.address}</p>
            <p style="margin: 5px 0; color: #666;"><strong>付款方式：</strong>${paymentMethodText}</p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
            如有任何問題，請聯繫我們的客服團隊。
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

  /**
   * 支付成功郵件模板
   */
  private getPaymentSuccessTemplate(
    orderNumber: string,
    totalAmount: number,
    userName?: string,
  ): string {
    const name = userName || '顧客';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>付款成功</title>
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

        <!-- Success Icon -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; background-color: #e8f5e9; border-radius: 50%; line-height: 80px;">
            <span style="font-size: 40px; color: #4caf50;">✓</span>
          </div>
        </div>

        <!-- Content -->
        <div style="color: #333; text-align: center;">
          <h2 style="color: #4a7c59; font-size: 24px; margin-bottom: 20px;">付款成功！</h2>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${name} 您好，
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
            您的訂單付款已成功完成。
          </p>

          <!-- Order Info -->
          <div style="background-color: #f5f5f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">訂單編號</p>
            <p style="margin: 0 0 20px; color: #4a7c59; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
              ${orderNumber}
            </p>
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">付款金額</p>
            <p style="margin: 0; color: #333; font-size: 28px; font-weight: bold;">
              NT$ ${totalAmount.toLocaleString()}
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #666;">
            我們將盡快為您準備商品並安排出貨。<br>
            出貨後您將收到物流追蹤通知。
          </p>

          <p style="font-size: 14px; color: #888; line-height: 1.6; margin-top: 30px;">
            預計出貨時間：1-3 個工作天
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

  /**
   * 發貨通知郵件模板
   */
  private getShippingNotificationTemplate(
    orderNumber: string,
    trackingNumber: string,
    userName?: string,
  ): string {
    const name = userName || '顧客';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>訂單已出貨</title>
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

        <!-- Shipping Icon -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; background-color: #e3f2fd; border-radius: 50%; line-height: 80px;">
            <span style="font-size: 40px;">📦</span>
          </div>
        </div>

        <!-- Content -->
        <div style="color: #333; text-align: center;">
          <h2 style="color: #4a7c59; font-size: 24px; margin-bottom: 20px;">您的訂單已出貨！</h2>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${name} 您好，
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
            好消息！您的訂單已經出貨，正在送往您指定的地址。
          </p>

          <!-- Order Info -->
          <div style="background-color: #f5f5f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">訂單編號</p>
            <p style="margin: 0 0 20px; color: #4a7c59; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
              ${orderNumber}
            </p>
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">物流追蹤號碼</p>
            <p style="margin: 0; color: #333; font-size: 20px; font-weight: bold; letter-spacing: 1px;">
              ${trackingNumber}
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            您可以使用上方的追蹤號碼，<br>
            在物流公司網站查詢配送進度。
          </p>

          <p style="font-size: 14px; color: #888; line-height: 1.6; margin-top: 30px;">
            預計配送時間：2-5 個工作天<br>
            （實際時間依配送地區而定）
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

  /**
   * 取得付款方式文字
   */
  private getPaymentMethodText(method?: string): string {
    const methodMap: Record<string, string> = {
      credit_card: '信用卡',
      atm: 'ATM 轉帳',
      cvs: '超商付款',
    };
    return methodMap[method || ''] || '線上付款';
  }
}
