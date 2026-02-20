'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import logger from '@/lib/logger'

/**
 * Google OAuth callback page
 * Processes user info from server redirect — tokens are in httpOnly cookies
 * URL format: /auth/callback#user=xxx&csrfToken=xxx
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Read user info from URL fragment (tokens are in httpOnly cookies)
        const hash = window.location.hash.substring(1) // Remove #
        const params = new URLSearchParams(hash)

        const userJson = params.get('user')
        const csrfToken = params.get('csrfToken')

        if (!userJson) {
          throw new Error('缺少認證資訊')
        }

        // Parse user info
        const user = JSON.parse(decodeURIComponent(userJson))

        // Save to authStore (tokens already in httpOnly cookies)
        setAuth(user, csrfToken ?? undefined)

        // Merge local cart to backend (if any)
        try {
          await useCartStore.getState().mergeLocalToBackend()
        } catch {
          // Ignore cart merge errors
          logger.warn('購物車合併失敗')
        }

        // Navigate to home
        router.push('/')
      } catch (err) {
        logger.error('Google 登入處理失敗', { error: err })
        setError(err instanceof Error ? err.message : '登入失敗')
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [router, setAuth])

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
        <p className="text-gray-600">
          {isProcessing ? '正在處理登入...' : '準備導向...'}
        </p>
      </div>
    </div>
  )
}
