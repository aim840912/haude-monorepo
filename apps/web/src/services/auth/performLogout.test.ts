/**
 * performLogout 單元測試
 *
 * 回歸防護：登出必須撤銷後端 session。只清前端 state 的話，httpOnly 的
 * refresh_token（30 天效期）仍留在瀏覽器且後端未撤銷，任何觸發 401 的請求
 * 都能讓 axios interceptor 把 session 換回來 —— 共用電腦上等於沒登出。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  authApi: { logout: vi.fn() },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: vi.fn() },
  clearAllAuthStorage: vi.fn(),
}))

import { performLogout } from './performLogout'
import { authApi } from '@/services/api'
import { useAuthStore, clearAllAuthStorage } from '@/stores/authStore'

const mockedLogoutApi = vi.mocked(authApi.logout)
const mockedGetState = vi.mocked(useAuthStore.getState)

describe('performLogout', () => {
  let storeLogout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    storeLogout = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedGetState.mockReturnValue({ logout: storeLogout } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedLogoutApi.mockResolvedValue({ data: {} } as any)
  })

  it('應呼叫後端撤銷 session', async () => {
    await performLogout()

    expect(mockedLogoutApi).toHaveBeenCalled()
  })

  it('應清除 auth storage 與 store 狀態', async () => {
    await performLogout()

    expect(storeLogout).toHaveBeenCalled()
    expect(clearAllAuthStorage).toHaveBeenCalled()
  })

  it('後端失敗時仍應清除本地狀態，且不向外拋錯', async () => {
    mockedLogoutApi.mockRejectedValue(new Error('Network Error'))

    await expect(performLogout()).resolves.toBeUndefined()

    expect(storeLogout).toHaveBeenCalled()
    expect(clearAllAuthStorage).toHaveBeenCalled()
  })

  it('應在清除本地狀態之前送出撤銷請求（否則請求會少帶 CSRF token）', async () => {
    const callOrder: string[] = []
    mockedLogoutApi.mockImplementation(() => {
      callOrder.push('api')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Promise.resolve({ data: {} } as any)
    })
    storeLogout.mockImplementation(() => {
      callOrder.push('storeLogout')
    })

    await performLogout()

    expect(callOrder).toEqual(['api', 'storeLogout'])
  })

  it('不應等待後端回應才清除本地狀態（API 冷啟動時 UI 仍須立即反應）', async () => {
    let resolveApi: (value: unknown) => void = () => {}
    mockedLogoutApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveApi = resolve
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
    )

    const pending = performLogout()
    await Promise.resolve() // 讓同步段落跑完，但 API 仍未回應

    expect(storeLogout).toHaveBeenCalled()

    resolveApi({ data: {} })
    await pending
  })
})
