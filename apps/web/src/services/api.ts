import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid (排除登入/註冊等認證端點的 401)
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
}

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// Products API
export const productsApi = {
  // Public endpoints
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get<string[]>('/products/categories'),
  checkName: (name: string, excludeId?: string) =>
    api.get<{ exists: boolean; name: string }>('/products/check-name', {
      params: { name, excludeId },
    }),
  getInventory: (id: string) =>
    api.get<{ stock: number; reservedStock: number }>(`/products/${id}/inventory`),

  // Admin endpoints (requires ADMIN role)
  getAllAdmin: () => api.get('/admin/products'),
  create: (data: {
    name: string
    description: string
    category: string
    price: number
    priceUnit?: string
    unitQuantity?: number
    originalPrice?: number
    isOnSale?: boolean
    saleEndDate?: string
    stock: number
    isActive?: boolean
  }) => api.post('/products', data),
  update: (
    id: string,
    data: {
      name?: string
      description?: string
      category?: string
      price?: number
      priceUnit?: string
      unitQuantity?: number
      originalPrice?: number
      isOnSale?: boolean
      saleEndDate?: string
      stock?: number
      isActive?: boolean
    }
  ) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

// Orders API
export const ordersApi = {
  // User endpoints (requires authentication)
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ orders: unknown[]; total: number; hasMore: boolean }>('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: {
    items: { productId: string; quantity: number }[]
    shippingAddress: {
      name: string
      phone: string
      street: string
      city: string
      postalCode: string
      country?: string
      notes?: string
    }
    paymentMethod?: string
    notes?: string
    discountCode?: string
  }) => api.post('/orders', data),
  cancel: (id: string, reason?: string) => api.patch(`/orders/${id}/cancel`, { reason }),

  // Admin endpoints (requires ADMIN role)
  getAllAdmin: (params?: { limit?: number; offset?: number }) =>
    api.get<{ orders: unknown[]; total: number; hasMore: boolean }>('/admin/orders', { params }),
  getStats: () => api.get('/admin/orders/stats'),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/admin/orders/${id}`, data),
}

// Discounts API
export const discountsApi = {
  /**
   * 驗證折扣碼
   * @param code 折扣碼
   * @param subtotal 訂單小計
   */
  validate: (code: string, subtotal: number) =>
    api.get<{
      valid: boolean
      discountType?: 'PERCENTAGE' | 'FIXED'
      discountValue?: number
      discountAmount?: number
      code?: string
      description?: string
      message?: string
    }>(`/discounts/${encodeURIComponent(code)}/validate`, {
      params: { subtotal },
    }),
}

// Reviews API
export const reviewsApi = {
  /**
   * 取得產品評論
   */
  getProductReviews: (productId: string, limit = 10, offset = 0) =>
    api.get<{
      reviews: Array<{
        id: string
        productId: string
        userId: string
        userName: string
        rating: number
        title: string
        content: string
        isVerified: boolean
        createdAt: string
      }>
      total: number
      hasMore: boolean
    }>(`/products/${productId}/reviews`, { params: { limit, offset } }),

  /**
   * 取得產品評分統計
   */
  getReviewStats: (productId: string) =>
    api.get<{
      averageRating: number
      totalReviews: number
      ratingDistribution: {
        1: number
        2: number
        3: number
        4: number
        5: number
      }
    }>(`/products/${productId}/reviews/stats`),

  /**
   * 新增評論
   */
  create: (productId: string, data: { rating: number; title: string; content: string }) =>
    api.post(`/products/${productId}/reviews`, data),

  /**
   * 更新評論
   */
  update: (id: string, data: { rating?: number; title?: string; content?: string }) =>
    api.put(`/reviews/${id}`, data),

  /**
   * 刪除評論
   */
  delete: (id: string) => api.delete(`/reviews/${id}`),

  /**
   * 檢查評論資格
   * 需要登入，返回是否可以評論及原因
   */
  checkEligibility: (productId: string) =>
    api.get<{
      canReview: boolean
      purchaseStatus: 'delivered' | 'ordered' | 'not_purchased'
      hasReviewed: boolean
      message: string
    }>(`/products/${productId}/reviews/check-eligibility`),
}

// Farm Tours API
export const farmToursApi = {
  // Public endpoints
  getAll: () => api.get('/farm-tours'),
  getUpcoming: () => api.get('/farm-tours/upcoming'),
  getById: (id: string) => api.get(`/farm-tours/${id}`),

  // Authenticated endpoints
  createBooking: (data: {
    tourId: string
    participants: number
    contactName: string
    contactPhone: string
    notes?: string
  }) => api.post('/farm-tours/bookings', data),
  getMyBookings: () => api.get('/farm-tours/bookings/my'),
  cancelBooking: (id: string) => api.patch(`/farm-tours/bookings/${id}/cancel`),

  // Admin endpoints
  getAllAdmin: () => api.get('/admin/farm-tours'),
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
    type?: string
    tags?: string[]
    isActive?: boolean
  }) => api.post('/admin/farm-tours', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/farm-tours/${id}`, data),
  delete: (id: string) => api.delete(`/admin/farm-tours/${id}`),
}

// Locations API
export const locationsApi = {
  // Public endpoints
  getAll: () => api.get('/locations'),
  getMain: () => api.get('/locations/main'),
  getById: (id: string) => api.get(`/locations/${id}`),

  // Admin endpoints
  getAllAdmin: () => api.get('/admin/locations'),
  create: (data: {
    name: string
    title?: string
    address: string
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
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/locations/${id}`, data),
  delete: (id: string) => api.delete(`/admin/locations/${id}`),
}

// Schedules API
export const schedulesApi = {
  // Public endpoints
  getAll: () => api.get('/schedules'),
  getUpcoming: () => api.get('/schedules/upcoming'),
  getByMonth: (year: number, month: number) =>
    api.get('/schedules/month', { params: { year, month } }),
  getById: (id: string) => api.get(`/schedules/${id}`),

  // Admin endpoints
  getAllAdmin: () => api.get('/admin/schedules'),
  create: (data: {
    title: string
    location: string
    date: string
    time: string
    status?: string
    products?: string[]
    description?: string
    contact?: string
    specialOffer?: string
    weatherNote?: string
    isActive?: boolean
  }) => api.post('/admin/schedules', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/admin/schedules/${id}`),
}

// 前端付款方式到後端的映射
const paymentMethodMap: Record<string, string> = {
  CREDIT: 'CREDIT',
  VACC: 'ATM', // 前端用 VACC，後端 ECPay 用 ATM
  CVS: 'CVS',
}

// Social Posts API
export const socialPostsApi = {
  /**
   * 取得所有啟用的社群貼文（公開端點）
   */
  getAll: () =>
    api.get<
      Array<{
        id: string
        platform: 'facebook' | 'instagram'
        url: string
        title?: string
        sortOrder: number
        isActive: boolean
        createdAt: string
        updatedAt: string
      }>
    >('/social-posts'),
}

// Payments API
export const paymentsApi = {
  /**
   * 建立付款請求
   * 後端會生成加密的 TradeInfo 和 TradeSha，前端用這些資料提交表單到綠界
   */
  create: (orderId: string, paymentMethod?: string) =>
    api.post<{
      success: boolean
      data: {
        paymentId: string
        formData: {
          action: string // 綠界 API URL
          method: 'POST'
          fields: Record<string, string | number>
        }
      }
    }>('/payments/create', {
      orderId,
      paymentMethod: paymentMethod ? paymentMethodMap[paymentMethod] || paymentMethod : undefined,
    }),

  /**
   * 查詢付款狀態
   */
  getStatus: (orderId: string) =>
    api.get<{
      success: boolean
      data: {
        status: 'pending' | 'paid' | 'failed' | 'expired'
        payTime?: string
        tradeNo?: string
      }
    }>(`/payments/${orderId}/status`),
}

// Search API
export const searchApiReal = {
  /**
   * 全站搜尋
   */
  search: (params: {
    q: string
    type?: ('product' | 'farmTour' | 'location')[]
    category?: string[]
    minPrice?: number
    maxPrice?: number
    minRating?: number
    limit?: number
    offset?: number
  }) =>
    api.get<{
      results: Array<{
        id: string
        title: string
        description: string
        type: 'product' | 'farmTour' | 'location'
        url: string
        category?: string
        image?: string
        price?: number
        rating?: number
        relevanceScore: number
      }>
      total: number
      query: string
      processingTime: number
    }>('/search', { params }),

  /**
   * 搜尋建議（自動完成）
   */
  getSuggestions: (q: string) =>
    api.get<string[]>('/search/suggestions', { params: { q } }),

  /**
   * 熱門搜尋
   */
  getTrending: () => api.get<string[]>('/search/trending'),
}
