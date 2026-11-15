import type { PaymentStatus } from '@haude/types'

export type PaymentResult = 'success' | 'failed' | 'confirming' | 'unknown'

/**
 * Decide what the payment result page shows, from the order the backend
 * returns — never from URL query parameters, which anyone can craft.
 *
 * - paid               → success
 * - failed / expired   → failed
 * - pending / missing  → confirming: ECPay's server notify can arrive after the
 *                        browser is sent back, so this is not a failure yet
 * - no order / refunded → unknown: send the customer to their orders page
 */
export function resolvePaymentResult(
  order: { paymentStatus?: PaymentStatus; status?: string } | null
): PaymentResult {
  if (!order) return 'unknown'
  // A cancelled order will never be paid: "still confirming" would wait forever
  if (order.status === 'cancelled' && order.paymentStatus !== 'paid') return 'unknown'
  switch (order.paymentStatus) {
    case 'paid':
      return 'success'
    case 'failed':
    case 'expired':
      return 'failed'
    case 'pending':
    case undefined:
      return 'confirming'
    default:
      return 'unknown'
  }
}
