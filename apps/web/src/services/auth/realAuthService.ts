import { api } from '@/services/api'
import type { AuthServiceInterface, AuthResponse, GetMeResponse } from './types'

/**
 * Real Auth Service
 * 串接真實後端 API
 */
export const realAuthService: AuthServiceInterface = {
  /**
   * 登入
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  /**
   * 註冊
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name })
    return data
  },

  /**
   * 驗證 Token / 取得當前用戶
   */
  async getMe(): Promise<GetMeResponse> {
    const { data } = await api.get<GetMeResponse>('/auth/me')
    return data
  },
}
