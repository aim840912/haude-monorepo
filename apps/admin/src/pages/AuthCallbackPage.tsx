import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api, setCsrfToken } from '../services/api'
import logger from '../lib/logger'

/**
 * Google OAuth callback page
 * Processes user info from server redirect — tokens are in httpOnly cookies
 * URL format: /auth/callback#user=xxx&csrfToken=xxx
 * Or error: /auth/callback#error=xxx
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Read parameters from URL fragment
        const hash = window.location.hash.substring(1) // Remove #
        const params = new URLSearchParams(hash)

        // Check for errors
        const errorMsg = params.get('error')
        if (errorMsg) {
          throw new Error(decodeURIComponent(errorMsg))
        }

        const userJson = params.get('user')
        const csrfTokenValue = params.get('csrfToken')

        if (!userJson) {
          throw new Error('缺少認證資訊')
        }

        // Store CSRF Token before API call (not required for GET, but ready for later)
        if (csrfTokenValue) {
          setCsrfToken(csrfTokenValue)
        }

        // Verify session is actually valid: httpOnly cookie must be accepted by server.
        // This prevents spoofing via crafted /auth/callback#user={fake} URLs.
        const { data: verifiedUser } = await api.get('/auth/me')

        // Authoritative role check against server-verified data (not the URL fragment)
        if (verifiedUser.role !== 'ADMIN') {
          throw new Error('您沒有管理員權限')
        }

        // Save server-verified user to authStore
        setAuth(verifiedUser)

        // Navigate to home
        navigate('/')
      } catch (err) {
        logger.error('Google 登入處理失敗', { error: err })
        setError(err instanceof Error ? err.message : '登入失敗')
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [navigate, setAuth])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">登入失敗</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isProcessing ? '正在處理登入...' : '準備導向...'}
        </p>
      </div>
    </div>
  )
}
