import { authApi } from '@/services/api'
import { useAuthStore, clearAllAuthStorage } from '@/stores/authStore'

/**
 * 完整登出：撤銷後端 session（httpOnly cookie 前端清不掉）→ 清前端 state 與 storage。
 *
 * 為什麼一定要打後端：JWT 存在 httpOnly cookie，只清 Zustand state 的話
 * refresh_token（30 天效期）仍留在瀏覽器且後端未撤銷，任何觸發 401 的請求
 * 都會讓 axios interceptor 用它換回有效 session —— 共用電腦上等於沒登出。
 *
 * 順序刻意如此：先「發出」請求（axios 的 request interceptor 於呼叫當下同步
 * 附上 CSRF header，所以此時 store 尚未清空），再立刻清本地狀態讓 UI 即時反應，
 * 不必等後端往返（API 冷啟動可能數十秒）。回傳的 Promise 讓呼叫端可選擇等待。
 */
export async function performLogout(): Promise<void> {
  const revoked = authApi.logout().catch(() => {
    // 後端不可達不影響本地登出
  })

  useAuthStore.getState().logout() // 內含購物車清理
  clearAllAuthStorage()

  await revoked
}
