import { api } from './client'

// ==================== Members API ====================
// 會員等級管理

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
