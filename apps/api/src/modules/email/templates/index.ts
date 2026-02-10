// Base template utilities
export {
  wrapInEmailTemplate,
  getBrandHeader,
  getEmailFooter,
  formatCurrency,
  getInfoCard,
  getCircleIcon,
  BRAND_COLORS,
} from './email-base.template';
export type { EmailBaseOptions } from './email-base.template';

// Password reset template
export { getPasswordResetTemplate } from './password-reset.template';
export type { PasswordResetTemplateData } from './password-reset.template';

// Order confirmation template
export { getOrderConfirmationTemplate } from './order-confirmation.template';
export type { OrderConfirmationTemplateData } from './order-confirmation.template';

// Payment success template
export { getPaymentSuccessTemplate } from './payment-success.template';
export type { PaymentSuccessTemplateData } from './payment-success.template';

// Shipping notification template
export { getShippingNotificationTemplate } from './shipping-notification.template';
export type { ShippingNotificationTemplateData } from './shipping-notification.template';

// Refund notification template
export { getRefundNotificationTemplate } from './refund-notification.template';
export type { RefundNotificationTemplateData } from './refund-notification.template';
