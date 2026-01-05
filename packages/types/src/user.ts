/**
 * 使用者相關型別 - 前後端共用
 */

export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
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
