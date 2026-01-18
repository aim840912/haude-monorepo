import { api } from './client'

// ==================== Orders API (Admin) ====================

export const ordersApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get(`/admin/orders?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/admin/orders/stats'),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}`, { status }),
}

// ==================== Dashboard API (Admin) ====================

export interface RevenueTrendData {
  date: string
  revenue: number
  orders: number
}

export interface OrderStatusData {
  status: string
  count: number
  label: string
}

export interface TopProductData {
  id: string
  name: string
  sales: number
  revenue: number
}

export const dashboardApi = {
  getRevenueTrend: (period: 'day' | 'week' | 'month' = 'day') =>
    api.get<RevenueTrendData[]>(`/admin/dashboard/revenue-trend?period=${period}`),
  getOrderStatus: () => api.get<OrderStatusData[]>('/admin/dashboard/order-status'),
  getTopProducts: (limit = 10) =>
    api.get<TopProductData[]>(`/admin/dashboard/top-products?limit=${limit}`),
}
