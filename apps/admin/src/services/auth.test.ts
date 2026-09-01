/**
 * performLogout 單元測試
 *
 * 回歸防護：登出必須同時撤銷後端 session（httpOnly cookie 前端清不掉），
 * 否則 ProtectedRoute 會用還活著的 cookie 把使用者重新登入，
 * 表現為「按下登出又被彈回儀表板」。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api/client', () => ({
  api: { post: vi.fn() },
  clearCsrfToken: vi.fn(),
}))

import { performLogout } from './auth'
import { api, clearCsrfToken } from './api/client'
import { useAuthStore } from '../stores/authStore'

const mockedPost = vi.mocked(api.post)

describe('performLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPost.mockResolvedValue({ data: { message: 'Logged out successfully' } })
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'admin@haude.tw',
        name: 'Admin',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      isAuthenticated: true,
      isAdmin: true,
    })
  })

  it('應呼叫後端 POST /auth/logout 撤銷 session', async () => {
    await performLogout()

    expect(mockedPost).toHaveBeenCalledWith('/auth/logout')
  })

  it('應清除 CSRF token 與前端 auth state', async () => {
    await performLogout()

    expect(clearCsrfToken).toHaveBeenCalled()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false)
  })

  it('後端失敗時仍應清除本地狀態，且不向外拋錯', async () => {
    mockedPost.mockRejectedValue(new Error('Network Error'))

    await expect(performLogout()).resolves.toBeUndefined()

    expect(clearCsrfToken).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('應先撤銷後端再清本地狀態（順序反了會讓請求少帶 cookie/CSRF）', async () => {
    const callOrder: string[] = []
    mockedPost.mockImplementation(() => {
      callOrder.push('api')
      return Promise.resolve({ data: {} })
    })
    vi.mocked(clearCsrfToken).mockImplementation(() => {
      callOrder.push('clearCsrf')
    })

    await performLogout()

    expect(callOrder).toEqual(['api', 'clearCsrf'])
  })
})
