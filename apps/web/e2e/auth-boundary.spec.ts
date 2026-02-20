import { test, expect, Page } from '@playwright/test'

/**
 * Auth Boundary E2E Tests
 *
 * Verify that protected routes correctly block unauthenticated access.
 * These tests catch the class of bugs where "logged-out users can still
 * see protected data" — the exact gap our happy-path tests missed.
 */

const LOCALE = 'zh-TW'

/** Routes wrapped with ProtectedRoute — must redirect to /login */
const PROTECTED_ROUTES = [
  '/orders',
  '/orders/test-order-id',
  '/checkout',
  '/account/security',
  '/account/membership',
] as const

/** Fake auth state matching Zustand persist shape */
const FAKE_AUTH_STATE = JSON.stringify({
  state: {
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' },
    token: 'fake-jwt-token-for-testing',
    csrfToken: null,
    isAuthenticated: true,
  },
  version: 0,
})

// ─── Helpers ───────────────────────────────────────────────

/** Set up a fake authenticated session via localStorage */
async function simulateLogin(page: Page) {
  await page.evaluate((authState) => {
    localStorage.setItem('auth-storage', authState)
  }, FAKE_AUTH_STATE)
}

/** Clear all auth state (simulates logout) */
async function simulateLogout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth-storage')
  })
}

/** Wait for client-side redirect to settle */
async function waitForRedirect(page: Page) {
  // ProtectedRoute uses useEffect + router.push, give it time to hydrate & redirect
  await page.waitForURL(/\/(login|zh-TW\/login)/, { timeout: 10000 }).catch(() => {
    // If timeout, we'll check the URL in the assertion instead of failing here
  })
}

/** Assert the page ended up on /login */
async function expectRedirectedToLogin(page: Page, fromRoute: string) {
  const url = page.url()
  expect(url, `Expected ${fromRoute} to redirect to /login, but got: ${url}`).toMatch(/\/login/)
}

// ─── Tests ─────────────────────────────────────────────────

test.describe('Auth Boundary: unauthenticated access', () => {
  test.beforeEach(async ({ page }) => {
    // Start clean — no auth state
    await page.goto(`/${LOCALE}`)
    await page.evaluate(() => localStorage.clear())
  })

  for (const route of PROTECTED_ROUTES) {
    test(`unauthenticated → ${route} → redirects to /login`, async ({ page }) => {
      await page.goto(`/${LOCALE}${route}`)
      await waitForRedirect(page)
      await expectRedirectedToLogin(page, route)
    })
  }
})

test.describe('Auth Boundary: post-logout access', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a logged-in session
    await page.goto(`/${LOCALE}`)
    await page.evaluate(() => localStorage.clear())
    await simulateLogin(page)
  })

  test('login → logout → /orders → redirects to /login', async ({ page }) => {
    // Verify we start authenticated
    await page.goto(`/${LOCALE}/orders`)
    // Page should load (may show empty orders or API error, but NOT redirect)
    await page.waitForTimeout(2000)

    // Now simulate logout
    await simulateLogout(page)

    // Try accessing protected route again
    await page.goto(`/${LOCALE}/orders`)
    await waitForRedirect(page)
    await expectRedirectedToLogin(page, '/orders (post-logout)')
  })

  test('login → logout → /checkout → redirects to /login', async ({ page }) => {
    await simulateLogout(page)
    await page.goto(`/${LOCALE}/checkout`)
    await waitForRedirect(page)
    await expectRedirectedToLogin(page, '/checkout (post-logout)')
  })

  test('login → logout → /orders/:id → redirects to /login', async ({ page }) => {
    await simulateLogout(page)
    await page.goto(`/${LOCALE}/orders/some-order-id`)
    await waitForRedirect(page)
    await expectRedirectedToLogin(page, '/orders/:id (post-logout)')
  })
})

test.describe('Auth Boundary: token cleared from storage', () => {
  test('clearing localStorage while on page → reload → redirects to /login', async ({ page }) => {
    // Set up authenticated session
    await page.goto(`/${LOCALE}`)
    await simulateLogin(page)

    // Navigate to a protected page
    await page.goto(`/${LOCALE}/orders`)
    await page.waitForTimeout(2000)

    // Simulate token being cleared (e.g., expired session, manual clear)
    await page.evaluate(() => {
      localStorage.removeItem('auth-storage')
    })

    // Reload the page — ProtectedRoute should detect missing auth
    await page.reload()
    await waitForRedirect(page)
    await expectRedirectedToLogin(page, '/orders (token cleared + reload)')
  })

  test('corrupted auth state → protected route → redirects to /login', async ({ page }) => {
    // Set corrupted auth data
    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: null, token: null, csrfToken: null, isAuthenticated: false },
        version: 0,
      }))
    })

    await page.goto(`/${LOCALE}/orders`)
    await waitForRedirect(page)
    await expectRedirectedToLogin(page, '/orders (corrupted auth)')
  })
})

test.describe('Auth Boundary: redirect preserves return URL', () => {
  test('redirect to /login includes "from" parameter', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.evaluate(() => localStorage.clear())

    await page.goto(`/${LOCALE}/orders`)
    await waitForRedirect(page)

    const url = page.url()
    // ProtectedRoute passes ?from={pathname}
    expect(url).toMatch(/from=/)
  })
})
