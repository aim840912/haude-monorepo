import { getShippingNotificationTemplate } from './shipping-notification.template';
import { getPaymentSuccessTemplate } from './payment-success.template';
import { getRefundNotificationTemplate } from './refund-notification.template';

/**
 * User names are set at registration without email verification, so these
 * values are attacker-controlled. Rendering them raw lets anyone send HTML
 * (links, fake forms) from the shop's own domain to an address they choose.
 */
const PAYLOAD = '<a href="https://evil.example">點我領獎</a>';
const ESCAPED = '&lt;a href=&quot;https://evil.example&quot;&gt;';

describe('email templates escape user-controlled values', () => {
  it('shipping notification escapes userName and trackingNumber', () => {
    const html = getShippingNotificationTemplate({
      orderNumber: 'HD-001',
      trackingNumber: PAYLOAD,
      userName: PAYLOAD,
    });

    expect(html).not.toContain(PAYLOAD);
    expect(html).toContain(ESCAPED);
  });

  it('payment success escapes userName', () => {
    const html = getPaymentSuccessTemplate({
      orderNumber: 'HD-001',
      totalAmount: 1000,
      userName: PAYLOAD,
    });

    expect(html).not.toContain(PAYLOAD);
    expect(html).toContain(ESCAPED);
  });

  it('refund notification escapes userName and an unknown payment type', () => {
    const html = getRefundNotificationTemplate({
      orderNumber: 'HD-001',
      refundAmount: 1000,
      paymentType: PAYLOAD,
      userName: PAYLOAD,
    });

    expect(html).not.toContain(PAYLOAD);
    expect(html).toContain(ESCAPED);
  });
});
