/**
 * processOAuthCallback 單元測試
 *
 * 回歸防護：callback 網址上的 #user= 任何人都能偽造。舊版先把它寫進 store
 * 再呼叫 /auth/me，驗證失敗也不清除 —— 登入失敗頁右上角卻顯示使用者名稱，
 * 而且寫進 localStorage，重新整理後仍在。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/auth', () => ({
  authService: { getMe: vi.fn() },
}))

import { processOAuthCallback } from './processOAuthCallback'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/authStore'

const mockedGetMe = vi.mocked(authService.getMe)

const serverUser = {
  id: 'u1',
  email: 'real@example.com',
  name: 'Real User',
  role: 'USER' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const forgedHash = `#user=${encodeURIComponent(
  JSON.stringify({ id: 'x', email: 'evil@example.com', name: 'Fake Admin', role: 'ADMIN' })
)}`

describe('processOAuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
  })

  it('/auth/me 失敗時 store 為未登入', async () => {
    mockedGetMe.mockRejectedValue(new Error('Request failed with status code 401'))

    await expect(processOAuthCallback(forgedHash)).rejects.toThrow()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('/auth/me 失敗時不曾寫入網址上的使用者', async () => {
    const seen: unknown[] = []
    const unsubscribe = useAuthStore.subscribe((s) => seen.push(s.user))
    mockedGetMe.mockRejectedValue(new Error('401'))

    await expect(processOAuthCallback(forgedHash)).rejects.toThrow()
    unsubscribe()

    expect(seen.some((u) => (u as { name?: string } | null)?.name === 'Fake Admin')).toBe(false)
  })

  // #error= 的內容任何人都能偽造（「帳號已凍結，請撥打 0800…」），不可原樣顯示
  it('#error= 時顯示固定文案，不顯示網址上的文字，且不呼叫 /auth/me', async () => {
    const phishing = '您的帳號已被凍結，請撥打 0800-000-000'

    const result = processOAuthCallback(`#error=${encodeURIComponent(phishing)}`)

    await expect(result).rejects.toThrow('登入失敗，請重新登入')
    await expect(result).rejects.not.toThrow(phishing)
    expect(mockedGetMe).not.toHaveBeenCalled()
  })

  it('成功時存入的是伺服器回傳的使用者，不是網址上的', async () => {
    mockedGetMe.mockResolvedValue({ user: serverUser })

    await processOAuthCallback(forgedHash)

    expect(useAuthStore.getState().user).toEqual(serverUser)
  })

  it('缺少 #user= 時拋出缺少認證資訊', async () => {
    await expect(processOAuthCallback('')).rejects.toThrow('缺少認證資訊')
  })
})
