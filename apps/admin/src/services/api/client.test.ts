/**
 * admin client.ts 刷新攔截器單元測試
 *
 * 回歸防護：刷新失敗時舊版不看原因一律登出。429（刷新端點每 IP 每分鐘 10 次）、
 * 5xx、網路錯誤、Render 冷啟動逾時都會把使用者踢回登入頁。只有刷新回
 * 401/403（session 真的失效）才該登出。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'

function fail(config: InternalAxiosRequestConfig, status?: number): AxiosError {
  const response = status
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ status, statusText: '', headers: {}, config, data: {} } as any)
    : undefined
  return new AxiosError(
    'Request failed',
    status ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_NETWORK,
    config,
    null,
    response
  )
}

/** Original request answers with these statuses in order; the last one repeats. */
function adapter(statuses: number[] = [401, 200]): AxiosAdapter {
  let calls = 0
  return async (config) => {
    const status = statuses[Math.min(calls, statuses.length - 1)]
    calls += 1
    if (status >= 400) throw fail(config, status)
    return { status, statusText: 'OK', headers: {}, config, data: { ok: true } }
  }
}

describe('api refresh interceptor', () => {
  let api: typeof import('./client').api
  let logout: ReturnType<typeof vi.fn<() => void>>
  let postSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetModules()
    ;({ api } = await import('./client'))
    const { useAuthStore } = await import('../../stores/authStore')
    logout = vi.fn<() => void>()
    useAuthStore.setState({ logout })
    api.defaults.adapter = adapter()
    postSpy = vi.spyOn(axios, 'post')
  })

  afterEach(() => {
    postSpy.mockRestore()
  })

  function refreshFailsWith(status?: number) {
    postSpy.mockImplementation(async (url: string) => {
      throw fail({ url, headers: {} } as InternalAxiosRequestConfig, status)
    })
  }

  it.each([429, 500, 503])('刷新回 %i 時不登出', async (status) => {
    refreshFailsWith(status)

    await expect(api.get('/orders')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).not.toHaveBeenCalled()
  })

  it('刷新遇到網路錯誤時不登出', async () => {
    refreshFailsWith(undefined)

    await expect(api.get('/orders')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).not.toHaveBeenCalled()
  })

  it('刷新回 403 時登出', async () => {
    refreshFailsWith(403)

    await expect(api.get('/orders')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).toHaveBeenCalledTimes(1)
  })

  // 多分頁：另一個分頁剛換掉 refresh token，這個分頁的刷新拿到 401，
  // 但瀏覽器裡的 cookie 已經是新的 —— 先重送一次原請求再決定要不要登出
  it('刷新回 401、重送原請求成功時不登出', async () => {
    refreshFailsWith(401)
    api.defaults.adapter = adapter([401, 200])

    const res = await api.get('/orders')

    expect(res.data).toEqual({ ok: true })
    expect(logout).not.toHaveBeenCalled()
  })

  it('刷新回 401、重送原請求仍然 401 時登出', async () => {
    refreshFailsWith(401)
    api.defaults.adapter = adapter([401, 401])

    await expect(api.get('/orders')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('刷新成功時重送原請求', async () => {
    postSpy.mockResolvedValue({ data: { message: 'ok' } })

    const res = await api.get('/orders')

    expect(res.data).toEqual({ ok: true })
    expect(logout).not.toHaveBeenCalled()
  })
})
