import { test, expect } from '@playwright/test'

const PROD_URL = process.env.PLAYWRIGHT_PROD_URL ?? 'http://localhost:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001'

test('Debug: Google OAuth cookie flow', async ({ page, context }) => {
  // Capture all API requests/responses
  const apiLogs: string[] = []

  page.on('request', (req) => {
    if (req.url().includes('haude-api') || req.url().includes('accounts.google')) {
      apiLogs.push(`>> ${req.method()} ${req.url()}`)
    }
  })

  page.on('response', (res) => {
    if (res.url().includes('haude-api')) {
      const setCookie = res.headers()['set-cookie'] || ''
      apiLogs.push(`<< ${res.status()} ${res.url()}`)
      if (setCookie) {
        apiLogs.push(`   Set-Cookie: ${setCookie.substring(0, 200)}...`)
      }
    }
  })

  // Step 1: Navigate to login page
  console.log('\n=== Step 1: Navigate to login page ===')
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
  console.log(`Current URL: ${page.url()}`)

  // Step 2: Pause for user to complete Google login
  console.log('\n=== Step 2: Please complete Google login ===')
  console.log('>>> Click Google login button, complete OAuth, then resume in Playwright Inspector <<<')
  await page.pause()

  // Step 3: After login, check state
  console.log('\n=== Step 3: Post-login diagnostics ===')
  const finalUrl = page.url()
  console.log(`Final URL: ${finalUrl}`)

  // Check cookies for the API domain
  const allCookies = await context.cookies([API_URL, PROD_URL])
  console.log('\n--- All Cookies ---')
  for (const cookie of allCookies) {
    console.log(
      `  ${cookie.name} | domain=${cookie.domain} | secure=${cookie.secure} | sameSite=${cookie.sameSite} | httpOnly=${cookie.httpOnly} | path=${cookie.path}`
    )
  }

  // Check specific auth cookies
  const accessToken = allCookies.find((c) => c.name === 'access_token')
  const refreshToken = allCookies.find((c) => c.name === 'refresh_token')
  const csrfToken = allCookies.find((c) => c.name === 'csrf-token')

  console.log('\n--- Auth Cookie Status ---')
  console.log(`access_token:  ${accessToken ? 'EXISTS' : 'MISSING'}`)
  console.log(`refresh_token: ${refreshToken ? 'EXISTS' : 'MISSING'}`)
  console.log(`csrf-token:    ${csrfToken ? 'EXISTS' : 'MISSING'}`)

  if (accessToken) {
    console.log(`\naccess_token details:`)
    console.log(`  domain:   ${accessToken.domain}`)
    console.log(`  secure:   ${accessToken.secure}`)
    console.log(`  sameSite: ${accessToken.sameSite}`)
    console.log(`  httpOnly: ${accessToken.httpOnly}`)
    console.log(`  path:     ${accessToken.path}`)
  }

  // Check localStorage auth state
  const authStorage = await page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return {
        isAuthenticated: parsed?.state?.isAuthenticated,
        hasUser: !!parsed?.state?.user,
        hasCsrfToken: !!parsed?.state?.csrfToken,
        userName: parsed?.state?.user?.name || null,
      }
    } catch {
      return { parseError: true }
    }
  })
  console.log('\n--- localStorage auth-storage ---')
  console.log(JSON.stringify(authStorage, null, 2))

  // Try a test API call to /auth/me
  console.log('\n--- Test API call: GET /auth/me ---')
  const meResponse = await page.evaluate(async (apiUrl) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
        credentials: 'include',
      })
      const body = await res.text()
      return { status: res.status, body: body.substring(0, 300) }
    } catch (e) {
      return { error: String(e) }
    }
  }, API_URL)
  console.log(JSON.stringify(meResponse, null, 2))

  // Print captured API logs
  console.log('\n--- Captured API Requests ---')
  for (const log of apiLogs) {
    console.log(log)
  }

  // Pause again so user can inspect DevTools
  console.log('\n=== Diagnostics complete. Inspect results above. ===')
  await page.pause()
})
