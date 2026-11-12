'use client'

import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth'

/**
 * Handle the OAuth / dev-login redirect: /auth/callback#user=... or #error=...
 *
 * The #user= fragment is attacker-controllable (anyone can craft the URL), so it
 * is only treated as "the API says login happened" — never written to the store.
 * The store is written solely from /auth/me, which proves the httpOnly cookie is
 * valid. On any failure the store is cleared, so nothing unverified survives in
 * localStorage.
 */
export async function processOAuthCallback(hash: string): Promise<void> {
  const params = new URLSearchParams(hash.replace(/^#/, ''))

  // The #error= text is attacker-controllable too: show a fixed message so the
  // site can't be made to display arbitrary text (phishing). Keep the detail
  // on the error for logging.
  const errorMsg = params.get('error')
  if (errorMsg) {
    throw new Error('登入失敗，請重新登入', { cause: errorMsg })
  }

  if (!params.get('user')) {
    throw new Error('缺少認證資訊')
  }

  try {
    const { user } = await authService.getMe()
    useAuthStore.getState().setAuth(user)
  } catch (err) {
    useAuthStore.getState().logout()
    throw err
  }
}
