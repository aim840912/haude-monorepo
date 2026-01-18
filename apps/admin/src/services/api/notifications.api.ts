import { api } from './client'

// ==================== Notifications API ====================
// 通知系統

export type NotificationType =
  | 'LOW_STOCK'
  | 'NEW_ORDER'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'SYSTEM'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  userId?: string
  createdAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
}

export const notificationsApi = {
  // 取得通知列表
  getAll: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.unreadOnly) params.append('unreadOnly', 'true')
    return api.get<NotificationListResponse>(`/admin/notifications?${params.toString()}`)
  },

  // 取得未讀數量
  getUnreadCount: () => api.get<{ count: number }>('/admin/notifications/unread-count'),

  // 標記單一通知為已讀
  markAsRead: (id: string) => api.patch<Notification>(`/admin/notifications/${id}/read`),

  // 標記所有通知為已讀
  markAllAsRead: () => api.patch<{ updated: number }>('/admin/notifications/read-all'),

  // 刪除通知
  delete: (id: string) => api.delete(`/admin/notifications/${id}`),
}

// ==================== Stock Alerts API ====================
// 庫存預警設定

export interface StockAlertSetting {
  id: string
  productId: string
  threshold: number
  isEnabled: boolean
  product: {
    id: string
    name: string
    stock: number
  }
  createdAt: string
  updatedAt: string
}

export const stockAlertsApi = {
  // 取得所有預警設定
  getAll: () => api.get<StockAlertSetting[]>('/admin/stock-alerts'),

  // 更新產品預警設定
  update: (productId: string, data: { threshold?: number; isEnabled?: boolean }) =>
    api.patch<StockAlertSetting>(`/admin/stock-alerts/${productId}`, data),
}
