import { mockAuthService } from './mockAuthService'
import { realAuthService } from './realAuthService'
import type { AuthServiceInterface } from './types'

/**
 * 根據環境變數決定使用 Mock 或 Real Auth Service
 *
 * 設定方式：
 * - .env.development: VITE_USE_MOCK=true
 * - .env.production: VITE_USE_MOCK=false
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const authService: AuthServiceInterface = USE_MOCK ? mockAuthService : realAuthService

// 開發時顯示當前模式
if (import.meta.env.DEV) {
  console.log(`[Auth Service] 使用 ${USE_MOCK ? 'Mock' : 'Real'} 模式`)
}

// 重新匯出類型
export type { AuthServiceInterface, AuthResponse, GetMeResponse } from './types'
