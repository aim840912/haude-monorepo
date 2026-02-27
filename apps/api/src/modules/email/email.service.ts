import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

// Types
import type { OrderEmailData } from './types';
export type { OrderItemInfo, OrderEmailData } from './types';

// Templates
import { getPasswordResetTemplate } from './templates/password-reset.template';
import { getOrderConfirmationTemplate } from './templates/order-confirmation.template';
import { getPaymentSuccessTemplate } from './templates/payment-success.template';
import { getShippingNotificationTemplate } from './templates/shipping-notification.template';
import { getRefundNotificationTemplate } from './templates/refund-notification.template';

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
    return this.sendEmail({
      to,
      subject: '重設您的密碼 - 豪德製茶所',
      html: getPasswordResetTemplate({ resetUrl, userName }),
      logMessage: '密碼重設郵件',
    });
  }

  /**
   * 發送訂單確認郵件
   */
  async sendOrderConfirmationEmail(
    to: string,
    order: OrderEmailData,
    userName?: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `訂單確認 #${order.orderNumber} - 豪德製茶所`,
      html: getOrderConfirmationTemplate({ order, userName }),
      logMessage: '訂單確認郵件',
    });
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
    return this.sendEmail({
      to,
      subject: `付款成功 #${orderNumber} - 豪德製茶所`,
      html: getPaymentSuccessTemplate({ orderNumber, totalAmount, userName }),
      logMessage: '支付成功郵件',
    });
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
    return this.sendEmail({
      to,
      subject: `您的訂單已出貨 #${orderNumber} - 豪德製茶所`,
      html: getShippingNotificationTemplate({
        orderNumber,
        trackingNumber,
        userName,
      }),
      logMessage: '發貨通知郵件',
    });
  }

  /**
   * 發送退款通知郵件
   */
  async sendRefundNotificationEmail(
    to: string,
    orderNumber: string,
    refundAmount: number,
    paymentType: string,
    userName?: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `退款通知 #${orderNumber} - 豪德製茶所`,
      html: getRefundNotificationTemplate({
        orderNumber,
        refundAmount,
        paymentType,
        userName,
      }),
      logMessage: '退款通知郵件',
    });
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 統一的郵件發送方法
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    logMessage: string;
  }): Promise<boolean> {
    const { to, subject, html, logMessage } = params;

    if (!this.isEnabled || !this.resend) {
      this.logger.warn(`Email service disabled - skipping email to ${to}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `豪德製茶所 <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`發送${logMessage}失敗: ${error.message}`);
        return false;
      }

      this.logger.log(`${logMessage}已發送至 ${to}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `發送${logMessage}時發生錯誤: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
