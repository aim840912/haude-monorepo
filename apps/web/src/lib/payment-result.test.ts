import { describe, expect, it } from 'vitest'
import { resolvePaymentResult } from './payment-result'

/**
 * The result page used to trust ?status=success from the URL, so anyone could
 * link to a "payment succeeded" page. The outcome must come from the order the
 * backend returns. ECPay's notify can also land after the browser comes back,
 * so an unpaid order is "still confirming", not a failure.
 */
describe('resolvePaymentResult', () => {
  it.each([
    ['paid', 'success'],
    ['failed', 'failed'],
    ['expired', 'failed'],
    ['pending', 'confirming'],
    [undefined, 'confirming'],
  ] as const)('paymentStatus %s -> %s', (paymentStatus, expected) => {
    expect(resolvePaymentResult({ paymentStatus })).toBe(expected)
  })

  it('is unknown when the order could not be loaded', () => {
    expect(resolvePaymentResult(null)).toBe('unknown')
  })

  it('a cancelled, unpaid order is not "still confirming"', () => {
    expect(resolvePaymentResult({ paymentStatus: 'pending', status: 'cancelled' })).toBe('unknown')
  })

  it('treats a refunded order as not a fresh success', () => {
    expect(resolvePaymentResult({ paymentStatus: 'refunded' })).toBe('unknown')
  })
})
