import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, isHydrated } = useAuthStore()

  // 如果已登入且是管理員，導向首頁
  useEffect(() => {
    if (isHydrated && isAuthenticated && isAdmin) {
      navigate('/')
    }
  }, [isHydrated, isAuthenticated, isAdmin, navigate])

  const handleGoogleLogin = () => {
    // 導向 API 的 Google OAuth，帶上 redirect=admin 參數
    window.location.href = `${API_URL}/auth/google?redirect=admin`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">豪德製茶所</h1>
          <p className="text-gray-600 mt-2">管理後台登入</p>
        </div>

        <div className="space-y-6">
          {/* 說明文字 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              請使用具有管理員權限的 Google 帳號登入。
              <br />
              如果您沒有管理員權限，請聯繫系統管理員。
            </p>
          </div>

          {/* Google 登入按鈕 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {/* Google Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">使用 Google 登入</span>
          </button>
        </div>

        {/* 底部資訊 */}
        <p className="mt-8 text-center text-sm text-gray-500">
          僅限管理員使用
        </p>
      </div>
    </div>
  )
}
