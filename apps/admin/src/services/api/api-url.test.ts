/**
 * 回歸防護：正式環境若直接打 onrender.com，API 設的登入 cookie 對
 * haude-admin.vercel.app 是第三方 cookie，Safari 與無痕模式會丟掉，
 * 登入後立刻 401。正式環境必須打同網域，由 vercel.json 代理到 Render。
 */
import { describe, it, expect } from 'vitest'
import { resolveApiUrl } from './api-url'

describe('resolveApiUrl', () => {
  it('正式環境走同網域路徑（vercel.json 代理）', () => {
    expect(
      resolveApiUrl({ PROD: true, VITE_API_BASE_URL: 'https://haude-api.onrender.com' })
    ).toBe('/api/v1')
  })

  it('開發環境直連本機 API', () => {
    expect(resolveApiUrl({ PROD: false, VITE_API_BASE_URL: 'http://localhost:3001' })).toBe(
      'http://localhost:3001/api/v1'
    )
  })

  it('開發環境未設定時預設 localhost:3001', () => {
    expect(resolveApiUrl({ PROD: false })).toBe('http://localhost:3001/api/v1')
  })
})
