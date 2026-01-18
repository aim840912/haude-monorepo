import { api } from './client'

// ==================== Discounts API ====================
// 折扣碼管理

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
