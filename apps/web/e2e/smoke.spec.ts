import { test, expect } from '@playwright/test'

/**
 * Smoke Tests — Full-site page load verification
 *
 * Every public page should:
 * 1. Return a non-error HTTP status (not 500)
 * 2. Render without uncaught JS errors
 * 3. Load within a reasonable time
 *
 * These are intentionally shallow — they catch deployment breaks,
 * missing env vars, and import errors, not business logic.
 */

const LOCALE = 'zh-TW'

/** All public routes that should load without authentication */
const PUBLIC_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/products', label: 'Products' },
  { path: '/cart', label: 'Cart' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
  { path: '/locations', label: 'Locations' },
  { path: '/farm-tours', label: 'Farm Tours' },
  { path: '/about', label: 'About' },
  { path: '/search', label: 'Search' },
] as const

test.describe('Smoke: public pages load without errors', () => {
  for (const { path, label } of PUBLIC_PAGES) {
    test(`${label} (${path}) loads successfully`, async ({ page }) => {
      // Collect console errors during page load
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          // Ignore known noisy errors that don't indicate real problems
          const isNoisy =
            text.includes('favicon.ico') ||
            text.includes('Failed to load resource') && text.includes('404') ||
            text.includes('hydration') // React hydration warnings in dev
          if (!isNoisy) {
            consoleErrors.push(text)
          }
        }
      })

      // Navigate and wait for network to settle
      const response = await page.goto(`/${LOCALE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })

      // 1. Page should return a valid response
      expect(response, `${label}: no response received`).not.toBeNull()

      // 2. HTTP status should not be a server error
      const status = response!.status()
      expect(status, `${label}: got HTTP ${status}`).toBeLessThan(500)

      // 3. Page should have a <body> with content
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // 4. No unexpected JS errors
      if (consoleErrors.length > 0) {
        console.warn(`[${label}] Console errors:`, consoleErrors)
      }
      expect(
        consoleErrors,
        `${label}: unexpected console errors:\n${consoleErrors.join('\n')}`
      ).toHaveLength(0)
    })
  }
})

test.describe('Smoke: critical elements present', () => {
  test('Home page has navigation', async ({ page }) => {
    await page.goto(`/${LOCALE}`, { waitUntil: 'domcontentloaded' })

    // Should have a nav element or header
    const nav = page.locator('nav').or(page.locator('header'))
    await expect(nav.first()).toBeVisible()
  })

  test('Products page renders product content', async ({ page }) => {
    await page.goto(`/${LOCALE}/products`, { waitUntil: 'domcontentloaded' })

    // Should have some content — either products or a loading/empty state
    const hasContent = page.getByText(/產品|茶|商品|Product/i)
    await expect(hasContent.first()).toBeVisible({ timeout: 10000 })
  })

  test('Login page has form', async ({ page }) => {
    await page.goto(`/${LOCALE}/login`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('button', { name: /登入/i })).toBeVisible()
  })
})
