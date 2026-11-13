import { api } from './client'

// ==================== Reviews API ====================
// 評論管理（顧客送出後預設直接公開，這裡是事後隱藏或刪除的地方）

export interface AdminReview {
  id: string
  rating: number
  title: string
  content: string
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
  product: { id: string; name: string } | null
}

export interface ReviewListResponse {
  reviews: AdminReview[]
  total: number
}

export const reviewsApi = {
  getAll: (params: { limit: number; offset: number; isApproved?: boolean }) =>
    api.get<ReviewListResponse>('/admin/reviews', { params }),

  // isApproved=false 等於從前台隱藏，資料仍保留，可以再改回公開
  setApproved: (id: string, isApproved: boolean) =>
    api.patch(`/admin/reviews/${id}/approve`, { isApproved }),

  // 只有 ADMIN 能刪除（STAFF 會收到 403）
  delete: (id: string) => api.delete(`/admin/reviews/${id}`),
}
