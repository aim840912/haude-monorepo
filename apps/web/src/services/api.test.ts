/**
 * api.ts 刷新攔截器單元測試
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
  let api: typeof import('./api').api
  let logout: ReturnType<typeof vi.fn<() => void>>
  let postSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetModules()
    ;({ api } = await import('./api'))
    const { useAuthStore } = await import('../stores/authStore')
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

  it.each([401, 403])('刷新回 %i 時直接登出，不重送原請求', async (status) => {
    refreshFailsWith(status)
    const calls: string[] = []
    const inner = adapter([401, 200])
    api.defaults.adapter = (config) => {
      calls.push(config.url ?? '')
      return inner(config)
    }

    await expect(api.get('/orders')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(1)
  })

  // 多分頁：另一個分頁剛換掉 refresh token，API 在寬限期內回 409。
  // 那個分頁的新 cookie 可能還在路上 —— 等一下再重送原請求，不登出
  describe('刷新回 409（另一個分頁剛換掉 token）', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('等待後重送原請求成功時不登出', async () => {
      refreshFailsWith(409)
      api.defaults.adapter = adapter([401, 200])

      const pending = api.get('/orders')
      await vi.advanceTimersByTimeAsync(2000)
      const res = await pending

      expect(res.data).toEqual({ ok: true })
      expect(logout).not.toHaveBeenCalled()
    })

    it('重送原請求仍然 401 時登出', async () => {
      refreshFailsWith(409)
      api.defaults.adapter = adapter([401, 401])

      const pending = api.get('/orders')
      const assertion = expect(pending).rejects.toBeInstanceOf(AxiosError)
      await vi.advanceTimersByTimeAsync(2000)
      await assertion

      expect(logout).toHaveBeenCalledTimes(1)
    })
  })

  it('刷新成功時重送原請求', async () => {
    postSpy.mockResolvedValue({ data: { message: 'ok' } })

    const res = await api.get('/orders')

    expect(res.data).toEqual({ ok: true })
    expect(logout).not.toHaveBeenCalled()
  })
})
