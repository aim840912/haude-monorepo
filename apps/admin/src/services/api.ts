import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - 加入 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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
