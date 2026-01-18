import { api } from './client'

// ==================== Social Posts API ====================
// 社群貼文管理

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
