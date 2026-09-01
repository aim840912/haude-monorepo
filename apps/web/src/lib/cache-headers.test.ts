/**
 * 快取標頭防護測試
 *
 * 回歸防護：個人化路徑一旦帶上 `public` 快取指令，CDN 就會把某一個人的頁面
 * 存下來發給所有後續訪客 —— 這是「多台電腦看到同一個陌生帳號」的成因。
 *
 * next.config.ts 的 headers() 是純函式，直接對它斷言最終生效的標頭。
 */

import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

type HeaderRule = { source: string; headers: Array<{ key: string; value: string }> }

/** 把 headers() 的規則陣列攤平成 source -> {key: value}，後者覆蓋前者（Next.js 語意） */
async function getRules(): Promise<HeaderRule[]> {
  const headersFn = (nextConfig as { headers?: () => Promise<HeaderRule[]> }).headers
  expect(headersFn, 'next.config 應該有 headers()').toBeTypeOf('function')
  return await headersFn!()
}

/** 用 Next.js 的 path-to-regexp 風格 source 比對一條實際路徑 */
function sourceMatches(source: string, pathname: string): boolean {
  const pattern = source
    .replace(/\//g, '\\/')
    .replace(/:\w+\*/g, '.*') // :path*  → 任意段（可為空）
    .replace(/:\w+/g, '[^/]+') // :locale → 單一段
    .replace(/\(\.\*\)/g, '.*') // (.*)
  return new RegExp(`^${pattern}$`).test(pathname)
}

/** 取得某路徑最終生效的某個標頭值（後定義的規則勝出） */
async function effectiveHeader(pathname: string, key: string): Promise<string | undefined> {
  const rules = await getRules()
  let value: string | undefined
  for (const rule of rules) {
    if (!sourceMatches(rule.source, pathname)) continue
    for (const h of rule.headers) {
      if (h.key.toLowerCase() === key.toLowerCase()) value = h.value
    }
  }
  return value
}

const PERSONALIZED = [
  '/account',
  '/account/membership',
  '/account/membership/points',
  '/orders',
  '/orders/abc123',
  '/cart',
  '/checkout',
  '/auth/callback',
  // 帶 locale 前綴的形式（localePrefix: 'as-needed'）
  '/en/account',
  '/en/orders/abc123',
  '/en/checkout',
  '/en/auth/callback',
]

const PUBLIC_PAGES = ['/', '/products', '/products/abc123', '/en/products', '/en/farm-tours']

describe('個人化路徑不得進入共享快取', () => {
  it.each(PERSONALIZED)('%s 不含 public 指令', async (pathname) => {
    const cc = await effectiveHeader(pathname, 'Cache-Control')

    expect(cc, `${pathname} 應該有 Cache-Control`).toBeDefined()
    expect(cc, `${pathname} 不可授權共享快取`).not.toMatch(/\bpublic\b/)
    expect(cc, `${pathname} 不可設定 s-maxage（CDN 快取時間）`).not.toMatch(/s-maxage/)
    expect(cc).toMatch(/no-store/)
  })

  // 注意：Next.js 15 會用自己的 RSC Vary 覆蓋這個值，所以線上回應看不到 Cookie。
  // 這裡斷言的是「設定意圖仍在」，實際防線是上面的 no-store（比 Vary 更強）。
  it.each(PERSONALIZED)('%s 在設定層宣告 Vary: Cookie', async (pathname) => {
    const vary = await effectiveHeader(pathname, 'Vary')

    expect(vary, `${pathname} 應該以 Cookie 區分快取`).toMatch(/Cookie/i)
  })
})

describe('公開頁面仍保有 CDN 快取（確認防護沒有誤殺效能）', () => {
  it.each(PUBLIC_PAGES)('%s 維持 public + s-maxage', async (pathname) => {
    const cc = await effectiveHeader(pathname, 'Cache-Control')

    expect(cc, `${pathname} 應該有 Cache-Control`).toBeDefined()
    expect(cc).toMatch(/\bpublic\b/)
    expect(cc).toMatch(/s-maxage=\d+/)
  })
})

describe('Next.js API 路由不快取', () => {
  it('/api/anything 為 no-store', async () => {
    const cc = await effectiveHeader('/api/anything', 'Cache-Control')

    expect(cc).toBe('no-store')
  })
})
