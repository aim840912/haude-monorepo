import { test, expect, type BrowserContext, type Page } from '@playwright/test'

/**
 * 線上冒煙：帳密登入的 cookie 在 WebKit（≈ Safari／無痕）是否正常
 *
 * 守的是 2026-11 修過的幾件事，任何一件退化都會在這裡失敗：
 * - 登入 cookie 必須是 web 網域的第一方 cookie（瀏覽器打同網域 /api/v1，由 Vercel 代理到 Render）；
 *   直接打 onrender.com 的話 WebKit 會丟掉 cookie，登入後立刻 401
 * - 勾「記住我」→ refresh cookie 30 天；刷新一次之後仍是 30 天
 * - 不勾 → session cookie，而且不會留下 remember_me
 * - CSRF 的 Origin 檢查不能擋到自己網站發出的 POST
 *
 * Google 登入不在這裡：Google 會擋自動化。它和帳密登入共用同一段設 cookie 的程式，
 * Google 那一段只需用 curl 確認 redirect_uri（見根目錄 CLAUDE.md「Web 登入 Cookie 必須是第一方」）。
 *
 * 帳號從環境變數讀，請用專門的測試帳號（不要用真實顧客或管理員帳號）。
 */

const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD

const DAY_S = 24 * 60 * 60
const REFRESH_PATH = '/api/v1/auth/refresh'

test.skip(!EMAIL || !PASSWORD, '需要 SMOKE_EMAIL 與 SMOKE_PASSWORD（測試帳號）')

async function login(page: Page, rememberMe: boolean) {
  await page.goto('/login')
  // Filling before React hydrates gets wiped: hydration resets the controlled
  // inputs to ''. React attaches __reactProps$<id> to a DOM node when it
  // hydrates it; wait for that (networkidle never settles under next dev's HMR
  // socket), then re-fill until both values stick.
  await page.waitForFunction(() => {
    const el = document.querySelector('#email')
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'))
  })
  await expect(async () => {
    await page.fill('#email', EMAIL!)
    await page.fill('#password', PASSWORD!)
    await expect(page.locator('#email')).toHaveValue(EMAIL!, { timeout: 1_000 })
    await expect(page.locator('#password')).toHaveValue(PASSWORD!, { timeout: 1_000 })
  }).toPass({ timeout: 15_000 })
  if (rememberMe) await page.check('#remember-me')
  await page.getByRole('button', { name: /登入/ }).last().click()

  // 成功會離開登入頁；失敗會留在原地並顯示紅色錯誤框（例如 401）
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 30_000 })
}

async function authCookies(context: BrowserContext) {
  const all = await context.cookies()
  const byName = (name: string) => all.find((c) => c.name === name)
  return {
    access: byName('access_token'),
    refresh: byName('refresh_token'),
    rememberMe: byName('remember_me'),
  }
}

/** Remaining lifetime in days; -1 expires = session cookie */
function daysLeft(expires: number | undefined): number {
  if (expires === undefined || expires < 0) return -1
  return (expires - Date.now() / 1000) / DAY_S
}

/** Same-origin request from inside the page, so the browser applies its real cookie rules */
async function api(page: Page, path: string, method = 'GET'): Promise<number> {
  return page.evaluate(
    async ([p, m]) => (await fetch(p, { method: m, credentials: 'include' })).status,
    [path, method] as const
  )
}

test.describe('登入 cookie（WebKit）', () => {
  test.afterEach(async ({ page }) => {
    // 清掉這次的 session；失敗不影響結果
    await api(page, '/api/v1/auth/logout', 'POST').catch(() => {})
  })

  test('勾記住我：第一方 cookie、30 天，刷新後仍是 30 天', async ({ page, context, baseURL }) => {
    await login(page, true)
    const host = new URL(baseURL!).hostname

    const before = await authCookies(context)
    expect(before.access?.domain, 'access_token 必須是 web 網域的第一方 cookie').toContain(host)
    expect(before.refresh?.path).toBe(REFRESH_PATH)
    expect(daysLeft(before.refresh?.expires), 'refresh_token 應為 30 天').toBeGreaterThan(29)
    expect(before.rememberMe, '勾了記住我應該有 remember_me cookie').toBeDefined()

    // 登入狀態真的可用（不是只有畫面顯示）
    expect(await api(page, '/api/v1/auth/me')).toBe(200)

    // 刷新：POST 帶自己的 Origin，也順便確認 CSRF 檢查沒擋到自己
    const refreshStatus = await api(page, REFRESH_PATH, 'POST')
    expect(refreshStatus, '刷新應成功').toBeLessThan(300)

    const after = await authCookies(context)
    expect(after.refresh?.value, '刷新後應換發新的 refresh_token').not.toBe(before.refresh?.value)
    expect(
      daysLeft(after.refresh?.expires),
      '刷新後仍應是 30 天（不可降成 session cookie）'
    ).toBeGreaterThan(29)
    expect(await api(page, '/api/v1/auth/me')).toBe(200)
  })

  test('不勾記住我：session cookie，不留 remember_me', async ({ page, context }) => {
    await login(page, false)

    const { refresh, rememberMe } = await authCookies(context)
    expect(refresh, '應該拿到 refresh_token').toBeDefined()
    expect(daysLeft(refresh?.expires), '沒勾記住我應是 session cookie').toBe(-1)
    expect(rememberMe, '不可留下 remember_me').toBeUndefined()
    expect(await api(page, '/api/v1/auth/me')).toBe(200)
  })
})
