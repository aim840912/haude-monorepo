'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { processOAuthCallback } from '@/services/auth/processOAuthCallback'
import logger from '@/lib/logger'

/**
 * Google OAuth callback page
 * Processes the server redirect — tokens are in httpOnly cookies
 * URL format: /auth/callback#user=xxx  or  /auth/callback#error=xxx
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      // Read synchronously: StrictMode runs this effect twice in dev, and both
      // runs must see the fragment before either one clears it below.
      const hash = window.location.hash

      try {
        await processOAuthCallback(hash)

        // Merge local cart to backend (if any)
        try {
          await useCartStore.getState().mergeLocalToBackend()
        } catch {
          // Ignore cart merge errors
          logger.warn('購物車合併失敗')
        }

        // Navigate to home — replace to keep /auth/callback out of history
        router.replace('/')
      } catch (err) {
        logger.error('Google 登入處理失敗', { error: err })
        // Drop the fragment so the user JSON doesn't linger in the address bar
        // or get re-processed on reload (success navigates away instead).
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setError(err instanceof Error ? err.message : '登入失敗')
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">登入失敗</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              返回登入頁面
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-tea mx-auto mb-4"></div>
        <p className="text-gray-600">{isProcessing ? '正在處理登入...' : '準備導向...'}</p>
      </div>
    </div>
  )
}
