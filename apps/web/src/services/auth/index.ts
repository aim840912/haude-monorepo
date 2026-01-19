import { realAuthService } from './realAuthService'
import type { AuthServiceInterface } from './types'

/**
 * 根據環境變數決定使用 Mock 或 Real Auth Service
 *
 * 設定方式：
 * - .env.development: NEXT_PUBLIC_USE_MOCK=true
 * - .env.production: NEXT_PUBLIC_USE_MOCK=false
 *
 * Mock 服務使用動態導入，確保不會被打包進生產環境
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

/**
 * 取得 Auth Service 實例
 * 生產環境直接返回 realAuthService
 * 開發環境若啟用 Mock 則動態載入 mockAuthService
 */
async function getAuthService(): Promise<AuthServiceInterface> {
  if (USE_MOCK) {
    const { mockAuthService } = await import('@/test/mocks/services/mockAuthService')
    return mockAuthService
  }
  return realAuthService
}

/**
 * Auth Service 代理
 * 透過代理模式實現動態選擇 Mock 或 Real 服務
 */
export const authService: AuthServiceInterface = {
  login: async (email, password) => {
    const service = await getAuthService()
    return service.login(email, password)
  },
  register: async (email, password, name) => {
    const service = await getAuthService()
    return service.register(email, password, name)
  },
  getMe: async () => {
    const service = await getAuthService()
    return service.getMe()
  },
}

// 開發時顯示當前模式
if (process.env.NODE_ENV !== 'production') {
  console.log(`[Auth Service] 使用 ${USE_MOCK ? 'Mock' : 'Real'} 模式`)
}

// 重新匯出類型
export type { AuthServiceInterface, AuthResponse, GetMeResponse } from './types'
