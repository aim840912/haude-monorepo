import { api, clearCsrfToken } from './api/client'
import { useAuthStore } from '../stores/authStore'

/**
 * 完整登出：撤銷後端 refresh token 並清除 httpOnly cookie → 清 CSRF token → 清前端 state。
 *
 * 為什麼一定要打後端：JWT 存在 httpOnly cookie，前端清不掉。只清 Zustand state 的話，
 * ProtectedRoute 的 session 復原邏輯會用還活著的 cookie 把使用者重新登入，
 * 表現就是「按了登出又回到儀表板」。
 *
 * 後端失敗（離線、500）不阻擋本地清除，否則使用者會卡在登不出去的狀態。
 */
export async function performLogout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // 後端不可達仍繼續清本地狀態
  }
  clearCsrfToken()
  useAuthStore.getState().logout()
}
