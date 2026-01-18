import { api } from './client'

// ==================== Users API ====================

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (
    id: string,
    data: { name?: string; role?: 'USER' | 'VIP' | 'STAFF' | 'ADMIN'; isActive?: boolean }
  ) => api.patch(`/users/${id}`, data),
}
