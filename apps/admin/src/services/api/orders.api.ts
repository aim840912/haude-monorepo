import { api } from './client'

// ==================== Orders API (Admin) ====================

export interface OrderExportFilters {
  startDate?: string
  endDate?: string
}

export const ordersApi = {
  getAll: (limit = 20, offset = 0, filters?: OrderExportFilters) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })
    if (filters?.startDate) params.set('startDate', filters.startDate)
    if (filters?.endDate) params.set('endDate', filters.endDate)
    return api.get(`/admin/orders?${params.toString()}`)
  },
  getForExport: (filters?: OrderExportFilters) =>
    ordersApi.getAll(10000, 0, filters),
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
