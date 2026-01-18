import { api } from './client'

// ==================== Schedules API (擺攤行程) ====================

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
