export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
export const API_PATH = '/api/v1'

/**
 * Absolute API URL — for server-side fetches (Server Components, sitemap),
 * which have no origin to resolve a relative path against.
 */
export const API_URL = `${API_BASE}${API_PATH}`

/**
 * Same-origin API path — for anything the browser requests.
 *
 * next.config rewrites proxy it to API_BASE, so the auth cookies the API sets
 * belong to the web origin (first-party). Calling API_URL from the browser
 * makes them third-party cookies of another site, which Safari and Chrome
 * incognito drop — login then fails with 401 right after the OAuth redirect.
 */
export const BROWSER_API_URL = API_PATH
