import { api } from '@/services/api'
import { AxiosError } from 'axios'
import type { AuthServiceInterface, AuthResponse, GetMeResponse } from './types'

/**
 * 將 API 錯誤轉換為用戶友善的錯誤訊息
 */
function getAuthErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.message

    // 根據 HTTP 狀態碼提供友善訊息（優先於後端英文訊息）
    switch (status) {
      case 401:
        return '電子郵件或密碼錯誤'
      case 403:
        return '帳號已被停用，請聯繫客服'
      case 404:
        return '找不到此帳號'
      case 409:
        return '此電子郵件已被註冊'
      case 429:
        return '嘗試次數過多，請稍後再試'
      case 500:
        return '伺服器錯誤，請稍後再試'
    }

    // 其他情況使用後端返回的訊息
    if (serverMessage && typeof serverMessage === 'string') {
      return serverMessage
    }
  }
  return defaultMessage
}

/**
 * Real Auth Service
 * 串接真實後端 API
 */
export const realAuthService: AuthServiceInterface = {
  /**
   * 登入
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      return data
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, '登入失敗，請稍後再試'))
    }
  },

  /**
   * 註冊
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name })
      return data
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, '註冊失敗，請稍後再試'))
    }
  },

  /**
   * 驗證 Token / 取得當前用戶
   */
  async getMe(): Promise<GetMeResponse> {
    const { data } = await api.get<GetMeResponse>('/auth/me')
    return data
  },
}
