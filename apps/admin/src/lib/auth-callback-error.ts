/**
 * Text for the login error page, from the `#error=` fragment.
 *
 * Anyone can send an admin a link like /auth/callback#error=<anything>, and
 * the page would show it under a red "登入失敗" banner on the real admin
 * domain (phishing text, fake support numbers). React escapes it, so this is
 * not XSS — but only the messages the API actually sends are shown verbatim.
 * Keep in sync with auth.controller.ts's `#error=` redirects.
 */
const API_MESSAGES = new Set(['登入驗證失敗，請重新登入', '您沒有管理員權限'])

const GENERIC = '登入失敗，請重新登入'

export function callbackErrorMessage(raw: string, isDev: boolean): string {
  if (API_MESSAGES.has(raw)) return raw
  if (isDev && raw.startsWith('Dev login failed:')) return raw
  return GENERIC
}
