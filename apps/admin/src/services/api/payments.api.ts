import { api } from './client'

// ==================== Payments API ====================
// 付款監控

export const paymentsApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get(`/admin/payments?limit=${limit}&offset=${offset}`),
  getLogs: (limit = 50, offset = 0) =>
    api.get(`/admin/payments/logs?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/admin/payments/stats'),
}
