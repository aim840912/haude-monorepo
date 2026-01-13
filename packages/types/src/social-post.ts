/**
 * 社群貼文相關型別 - 前後端共用
 */

/**
 * 社群平台類型
 */
export type SocialPlatform = 'facebook' | 'instagram'

/**
 * 社群貼文
 */
export interface SocialPost {
  id: string
  platform: SocialPlatform
  url: string
  title?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 建立社群貼文請求
 */
export interface CreateSocialPostRequest {
  platform: SocialPlatform
  url: string
  title?: string
  sortOrder?: number
  isActive?: boolean
}

/**
 * 更新社群貼文請求
 */
export interface UpdateSocialPostRequest {
  platform?: SocialPlatform
  url?: string
  title?: string
  sortOrder?: number
  isActive?: boolean
}

/**
 * 社群貼文列表回應
 */
export interface SocialPostListResponse {
  posts: SocialPost[]
  total: number
}
