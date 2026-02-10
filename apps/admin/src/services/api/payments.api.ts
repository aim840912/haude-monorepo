import { api } from './client'

// ==================== Payments API ====================
// 付款監控

export const paymentsApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get(`/admin/payments?limit=${limit}&offset=${offset}`),
  getLogs: (limit = 50, offset = 0) =>
    api.get(`/admin/payments/logs?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/admin/payments/stats'),
  // 退款
  processRefund: (data: {
    paymentId: string
    type: 'FULL' | 'PARTIAL'
    amount?: number
    reason?: string
  }) => api.post('/admin/payments/refund', data),
  confirmManualRefund: (refundId: string, notes?: string) =>
    api.post(`/admin/payments/refund/${refundId}/confirm`, { notes }),
  getRefunds: (paymentId: string) =>
    api.get(`/admin/payments/${paymentId}/refunds`),
}
