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
      inventory?: number
      isActive?: boolean
    }
  ) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
}

// Orders API (Admin)
export const ordersApi = {
  getAll: () => api.get('/admin/orders'),
  getStats: () => api.get('/admin/orders/stats'),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}`, { status }),
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    api.put(`/users/${id}`, data),
}

// Farm Tours API
export const farmToursApi = {
  // 公開 API（取得所有活動）
  getAll: () => api.get('/farm-tours'),
  getById: (id: string) => api.get(`/farm-tours/${id}`),
  // 管理員 API
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
