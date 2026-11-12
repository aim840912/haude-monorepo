// API version centrally managed: only change here when upgrading
export const API_VERSION = 'v1'

/**
 * Where the browser sends API requests.
 *
 * Production uses the same-origin path, which vercel.json proxies to Render.
 * The auth cookies the API sets then belong to the admin origin (first-party);
 * calling onrender.com directly makes them third-party cookies that Safari and
 * Chrome incognito drop, so login fails with 401 right after it succeeds.
 *
 * Development calls the local API directly: localhost:5174 → localhost:3001 is
 * same-site, so its cookies are first-party anyway.
 */
export function resolveApiUrl(env: { PROD: boolean; VITE_API_BASE_URL?: string }): string {
  const path = `/api/${API_VERSION}`
  if (env.PROD) return path
  return `${env.VITE_API_BASE_URL || 'http://localhost:3001'}${path}`
}

export const API_URL = resolveApiUrl(import.meta.env)
