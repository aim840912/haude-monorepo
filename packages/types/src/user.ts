/**
 * 使用者相關型別 - 前後端共用
 */

export type UserRole = 'USER' | 'VIP' | 'STAFF' | 'ADMIN'

export type MemberLevel = 'NORMAL' | 'BRONZE' | 'SILVER' | 'GOLD'

export type PointTransactionType =
  | 'PURCHASE'    // 消費獲得
  | 'BIRTHDAY'    // 生日獎勵
  | 'REDEMPTION'  // 兌換扣除
  | 'ADJUSTMENT'  // 管理員調整
  | 'EXPIRATION'  // 過期扣除

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  address?: string
  // 會員等級相關
  memberLevel?: MemberLevel
  totalSpent?: number
  currentPoints?: number
  birthday?: string
  createdAt: string
  updatedAt: string
}

export interface MemberLevelInfo {
  level: MemberLevel
  displayName: string
  totalSpent: number
  currentPoints: number
  discountPercent: number
  freeShipping: boolean
  pointMultiplier: number
}

export interface UpgradeProgress {
  currentLevel: MemberLevel
  currentLevelName: string
  totalSpent: number
  nextLevel: MemberLevel | null
  nextLevelName: string | null
  amountToNextLevel: number | null
  progressPercent: number
}

export interface MemberLevelConfig {
  id: string
  level: MemberLevel
  displayName: string
  minSpent: number
  discountPercent: number
  freeShipping: boolean
  pointMultiplier: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  access_token: string
}
