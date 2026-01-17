import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { setCsrfToken } from '../services/api'
import logger from '../lib/logger'

/**
 * Google OAuth 回調頁面
 * 處理從後端重導向回來的 token 和用戶資訊
 * URL 格式: /auth/callback#token=xxx&user=xxx&csrfToken=xxx
 * 或錯誤: /auth/callback#error=xxx
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 從 URL fragment 取得參數
        const hash = window.location.hash.substring(1) // 移除 #
        const params = new URLSearchParams(hash)

        // 檢查是否有錯誤
        const errorMsg = params.get('error')
        if (errorMsg) {
          throw new Error(decodeURIComponent(errorMsg))
        }

        const token = params.get('token')
        const userJson = params.get('user')
        const csrfTokenValue = params.get('csrfToken')

        if (!token || !userJson) {
          throw new Error('缺少認證資訊')
        }

        // 解析用戶資訊
        const user = JSON.parse(decodeURIComponent(userJson))

        // 再次確認是 ADMIN 角色（雙重驗證）
        if (user.role !== 'ADMIN') {
          throw new Error('您沒有管理員權限')
        }

        // 儲存到 authStore
        setAuth(user, token)

        // 同時儲存 token 到 localStorage（供 API 攔截器使用）
        localStorage.setItem('admin-token', token)

        // 儲存 CSRF Token（CSRF 防護所需）
        if (csrfTokenValue) {
          setCsrfToken(csrfTokenValue)
        }

        // 導向到首頁
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
