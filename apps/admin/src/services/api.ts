import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 攜帶 Cookie（CSRF 防護所需）
})

// Request interceptor - 加入 JWT token 和 CSRF token
api.interceptors.request.use((config) => {
  // JWT Token
  const token = localStorage.getItem('admin-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // CSRF Token（僅非安全方法需要）
  const csrfToken = localStorage.getItem('admin-csrf-token')
  const method = config.method?.toUpperCase()
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (csrfToken && method && !safeMethods.includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

// Response interceptor - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token')
      localStorage.removeItem('admin-csrf-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== CSRF Token 存取 ====================

/**
 * 設定 CSRF Token
 */
export function setCsrfToken(token: string): void {
  localStorage.setItem('admin-csrf-token', token)
}

/**
 * 取得 CSRF Token
 */
export function getCsrfToken(): string | null {
  return localStorage.getItem('admin-csrf-token')
}

/**
 * 清除 CSRF Token
 */
export function clearCsrfToken(): void {
  localStorage.removeItem('admin-csrf-token')
}

// Products API
export const productsApi = {
  getAll: () => api.get('/products'),
  getAllAdmin: () => api.get('/admin/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  createDraft: () => api.post('/admin/products/draft'),
  create: (data: {
    name: string
    description?: string
    price: number
    category?: string
    inventory?: number
  }) => api.post('/admin/products', data),
  update: (
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      category?: string
      stock?: number
      isActive?: boolean
      isDraft?: boolean
    }
  ) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

// Product Images API
export interface ProductImage {
  id: string
  productId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  filePath: string
  publicUrl: string
}

export const productImagesApi = {
  // 取得產品的所有圖片
  getImages: (productId: string) =>
    api.get<ProductImage[]>(`/admin/products/${productId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (productId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/products/${productId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    productId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<ProductImage>(`/admin/products/${productId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    productId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<ProductImage>(`/admin/products/${productId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (productId: string, imageId: string) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (productId: string, imageIds: string[]) =>
    api.put<ProductImage[]>(`/admin/products/${productId}/images/reorder`, {
      imageIds,
    }),
}

// Orders API (Admin)
export const ordersApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get(`/admin/orders?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/admin/orders/stats'),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}`, { status }),
}

// Dashboard API (Admin)
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

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (
    id: string,
    data: { name?: string; role?: 'USER' | 'VIP' | 'STAFF' | 'ADMIN'; isActive?: boolean }
  ) => api.patch(`/users/${id}`, data),
}

// Farm Tours API
export const farmToursApi = {
  // 公開 API（取得所有活動）
  getAll: () => api.get('/farm-tours'),
  getById: (id: string) => api.get(`/farm-tours/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get('/admin/farm-tours'),
  createDraft: () => api.post('/admin/farm-tours/draft'),
  create: (data: {
    name: string
    description: string
    date: string
    startTime: string
    endTime: string
    price: number
    maxParticipants: number
    location: string
    imageUrl?: string
    type: 'harvest' | 'workshop' | 'tour' | 'tasting'
    tags?: string[]
  }) => api.post('/admin/farm-tours', data),
  update: (
    id: string,
    data: {
      name?: string
      description?: string
      date?: string
      startTime?: string
      endTime?: string
      price?: number
      maxParticipants?: number
      location?: string
      imageUrl?: string
      status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      type?: 'harvest' | 'workshop' | 'tour' | 'tasting'
      tags?: string[]
    }
  ) => api.put(`/admin/farm-tours/${id}`, data),
  delete: (id: string) => api.delete(`/admin/farm-tours/${id}`),
}

// Farm Tour Images API
export interface FarmTourImage {
  id: string
  farmTourId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export const farmTourImagesApi = {
  // 取得農場體驗的所有圖片
  getImages: (farmTourId: string) =>
    api.get<FarmTourImage[]>(`/admin/farm-tours/${farmTourId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (farmTourId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/farm-tours/${farmTourId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    farmTourId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<FarmTourImage>(`/admin/farm-tours/${farmTourId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    farmTourId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<FarmTourImage>(`/admin/farm-tours/${farmTourId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (farmTourId: string, imageId: string) =>
    api.delete(`/admin/farm-tours/${farmTourId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (farmTourId: string, imageIds: string[]) =>
    api.put<FarmTourImage[]>(`/admin/farm-tours/${farmTourId}/images/reorder`, {
      imageIds,
    }),
}

// Schedules API (擺攤行程)
export const schedulesApi = {
  // 公開 API
  getAll: () => api.get('/schedules'),
  getUpcoming: () => api.get('/schedules/upcoming'),
  getByMonth: (year: number, month: number) =>
    api.get(`/schedules/month?year=${year}&month=${month}`),
  getById: (id: string) => api.get(`/schedules/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get('/admin/schedules'),
  create: (data: {
    title: string
    location: string
    date: string
    time: string
    products: string[]
    description: string
    contact: string
    specialOffer?: string
    weatherNote?: string
  }) => api.post('/admin/schedules', data),
  update: (
    id: string,
    data: {
      title?: string
      location?: string
      date?: string
      time?: string
      status?: 'upcoming' | 'ongoing' | 'completed'
      products?: string[]
      description?: string
      contact?: string
      specialOffer?: string
      weatherNote?: string
    }
  ) => api.put(`/admin/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/admin/schedules/${id}`),
}

// Payments API (付款監控)
export const paymentsApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get(`/admin/payments?limit=${limit}&offset=${offset}`),
  getLogs: (limit = 50, offset = 0) =>
    api.get(`/admin/payments/logs?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/admin/payments/stats'),
}

// Discounts API (折扣碼)
export interface DiscountCode {
  id: string
  code: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount: number
  perUserLimit: number
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const discountsApi = {
  getAll: () => api.get<DiscountCode[]>('/admin/discounts'),
  getById: (id: string) => api.get<DiscountCode>(`/admin/discounts/${id}`),
  create: (data: {
    code: string
    description?: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    minOrderAmount?: number
    maxDiscount?: number
    usageLimit?: number
    perUserLimit?: number
    startDate?: string
    endDate?: string
    isActive?: boolean
  }) => api.post<DiscountCode>('/admin/discounts', data),
  update: (
    id: string,
    data: {
      description?: string
      discountValue?: number
      minOrderAmount?: number
      maxDiscount?: number
      usageLimit?: number
      perUserLimit?: number
      startDate?: string
      endDate?: string
      isActive?: boolean
    }
  ) => api.put<DiscountCode>(`/admin/discounts/${id}`, data),
  delete: (id: string) => api.delete(`/admin/discounts/${id}`),
}

// Locations API (門市據點)
export const locationsApi = {
  // 公開 API
  getAll: () => api.get('/locations'),
  getMain: () => api.get('/locations/main'),
  getById: (id: string) => api.get(`/locations/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get('/admin/locations'),
  createDraft: () => api.post('/admin/locations/draft'),
  create: (data: {
    name: string
    address: string
    title?: string
    landmark?: string
    phone?: string
    lineId?: string
    hours?: string
    closedDays?: string
    parking?: string
    publicTransport?: string
    features?: string[]
    specialties?: string[]
    lat?: number
    lng?: number
    image?: string
    isMain?: boolean
    isActive?: boolean
  }) => api.post('/admin/locations', data),
  update: (
    id: string,
    data: {
      name?: string
      address?: string
      title?: string
      landmark?: string
      phone?: string
      lineId?: string
      hours?: string
      closedDays?: string
      parking?: string
      publicTransport?: string
      features?: string[]
      specialties?: string[]
      lat?: number
      lng?: number
      image?: string
      isMain?: boolean
      isActive?: boolean
    }
  ) => api.put(`/admin/locations/${id}`, data),
  delete: (id: string) => api.delete(`/admin/locations/${id}`),
}

// Location Images API
export interface LocationImage {
  id: string
  locationId: string
  storageUrl: string
  filePath: string
  altText?: string
  displayPosition: number
  size: 'thumbnail' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export const locationImagesApi = {
  // 取得據點的所有圖片
  getImages: (locationId: string) =>
    api.get<LocationImage[]>(`/admin/locations/${locationId}/images`),

  // 取得上傳 URL（用於前端直傳到 Supabase）
  getUploadUrl: (locationId: string, fileName: string) =>
    api.post<UploadUrlResponse>(`/admin/locations/${locationId}/images/upload-url`, {
      fileName,
    }),

  // 新增圖片記錄（上傳完成後呼叫）
  addImage: (
    locationId: string,
    data: {
      storageUrl: string
      filePath: string
      altText?: string
      displayPosition?: number
      size?: 'thumbnail' | 'medium' | 'large'
    }
  ) => api.post<LocationImage>(`/admin/locations/${locationId}/images`, data),

  // 更新圖片資訊
  updateImage: (
    locationId: string,
    imageId: string,
    data: {
      altText?: string
      displayPosition?: number
    }
  ) => api.put<LocationImage>(`/admin/locations/${locationId}/images/${imageId}`, data),

  // 刪除圖片
  deleteImage: (locationId: string, imageId: string) =>
    api.delete(`/admin/locations/${locationId}/images/${imageId}`),

  // 重新排序圖片
  reorderImages: (locationId: string, imageIds: string[]) =>
    api.put<LocationImage[]>(`/admin/locations/${locationId}/images/reorder`, {
      imageIds,
    }),
}

// Social Posts API (社群貼文)
export interface SocialPost {
  id: string
  platform: 'facebook' | 'instagram'
  url: string
  title?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const socialPostsApi = {
  // 公開 API
  getAll: () => api.get<SocialPost[]>('/social-posts'),
  getById: (id: string) => api.get<SocialPost>(`/social-posts/${id}`),
  // 管理員 API
  getAllAdmin: () => api.get<SocialPost[]>('/admin/social-posts'),
  create: (data: {
    platform: 'facebook' | 'instagram'
    url: string
    title?: string
    sortOrder?: number
    isActive?: boolean
  }) => api.post<SocialPost>('/admin/social-posts', data),
  update: (
    id: string,
    data: {
      platform?: 'facebook' | 'instagram'
      url?: string
      title?: string
      sortOrder?: number
      isActive?: boolean
    }
  ) => api.put<SocialPost>(`/admin/social-posts/${id}`, data),
  delete: (id: string) => api.delete(`/admin/social-posts/${id}`),
  reorder: (ids: string[]) => api.put<SocialPost[]>('/admin/social-posts/reorder', { ids }),
}

// Notifications API (通知系統)
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

// Stock Alerts API (庫存預警設定)
export const stockAlertsApi = {
  // 取得所有預警設定
  getAll: () => api.get<StockAlertSetting[]>('/admin/stock-alerts'),

  // 更新產品預警設定
  update: (productId: string, data: { threshold?: number; isEnabled?: boolean }) =>
    api.patch<StockAlertSetting>(`/admin/stock-alerts/${productId}`, data),
}

// Members API (會員等級管理)
export type MemberLevel = 'NORMAL' | 'BRONZE' | 'SILVER' | 'GOLD'

export interface AdminMember {
  id: string
  email: string
  name: string
  memberLevel: MemberLevel
  totalSpent: number
  currentPoints: number
  levelUpdatedAt?: string
  createdAt: string
}

export interface MemberListResponse {
  items: AdminMember[]
  total: number
  hasMore: boolean
}

export interface MemberDetail extends AdminMember {
  birthday?: string
  levelConfig: {
    displayName: string
    discountPercent: number
    freeShipping: boolean
    pointMultiplier: number
  } | null
}

export interface LevelHistoryItem {
  id: string
  fromLevel: MemberLevel
  toLevel: MemberLevel
  reason: string
  triggeredBy?: string
  createdAt: string
}

export interface LevelHistoryResponse {
  items: LevelHistoryItem[]
  total: number
  hasMore: boolean
}

export interface PointHistoryItem {
  id: string
  type: 'PURCHASE' | 'BIRTHDAY' | 'REDEMPTION' | 'ADJUSTMENT' | 'EXPIRATION'
  points: number
  balance: number
  description?: string
  createdAt: string
}

export interface PointHistoryResponse {
  items: PointHistoryItem[]
  total: number
  hasMore: boolean
}

export const membersApi = {
  // 取得會員列表（含等級篩選）
  getAll: (params?: { level?: MemberLevel; search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.level) searchParams.append('level', params.level)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    return api.get<MemberListResponse>(`/admin/members?${searchParams.toString()}`)
  },

  // 取得會員詳情
  getById: (id: string) => api.get<MemberDetail>(`/admin/members/${id}`),

  // 取得會員等級變更歷史
  getLevelHistory: (id: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    return api.get<LevelHistoryResponse>(`/admin/members/${id}/level-history?${searchParams.toString()}`)
  },

  // 取得會員積分交易歷史
  getPointsHistory: (id: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    return api.get<PointHistoryResponse>(`/admin/members/${id}/points/history?${searchParams.toString()}`)
  },

  // 手動調整會員等級
  adjustLevel: (id: string, data: { level: MemberLevel; reason?: string }) =>
    api.patch<{ success: boolean; user: { id: string; memberLevel: MemberLevel } }>(
      `/admin/members/${id}/level`,
      data
    ),

  // 手動調整會員積分
  adjustPoints: (id: string, data: { points: number; reason?: string }) =>
    api.patch<{ success: boolean; newBalance: number }>(`/admin/members/${id}/points`, data),
}

// Reports API (銷售報表)
export interface PeriodStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  cancelRate: number
}

export interface SalesSummaryResponse {
  current: PeriodStats
  compare: PeriodStats | null
  changes: {
    revenueChange: number
    ordersChange: number
    aovChange: number
    cancelRateChange: number
  } | null
  period: {
    start: string
    end: string
  }
}

export interface SalesTrendItem {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

export interface SalesDetailItem {
  date: string
  orderNumber: string
  customerName: string
  productCount: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: string
  paymentStatus: string
}

export interface SalesDetailResponse {
  items: SalesDetailItem[]
  total: number
  hasMore: boolean
}

export type CompareMode = 'yoy' | 'mom' | 'wow'
export type GroupBy = 'day' | 'week' | 'month'

export const reportsApi = {
  // 取得銷售摘要（含同比環比）
  getSummary: (params: {
    startDate: string
    endDate: string
    compareMode?: CompareMode
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.compareMode) {
      searchParams.append('compareMode', params.compareMode)
    }
    return api.get<SalesSummaryResponse>(`/admin/reports/summary?${searchParams.toString()}`)
  },

  // 取得銷售趨勢
  getSalesTrend: (params: {
    startDate: string
    endDate: string
    groupBy?: GroupBy
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.groupBy) {
      searchParams.append('groupBy', params.groupBy)
    }
    return api.get<SalesTrendItem[]>(`/admin/reports/sales-trend?${searchParams.toString()}`)
  },

  // 取得銷售明細（分頁）
  getSalesDetail: (params: {
    startDate: string
    endDate: string
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    })
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.offset) {
      searchParams.append('offset', params.offset.toString())
    }
    return api.get<SalesDetailResponse>(`/admin/reports/sales-detail?${searchParams.toString()}`)
  },
}
