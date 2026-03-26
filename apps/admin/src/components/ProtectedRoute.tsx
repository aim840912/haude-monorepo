import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, type AdminUser } from '../stores/authStore'
import { api, setCsrfToken } from '../services/api/client'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isAdmin, isHydrated, setAuth } = useAuthStore()
  const [isCheckingCookie, setIsCheckingCookie] = useState(false)
  const [cookieChecked, setCookieChecked] = useState(false)

  // When Zustand store is empty (e.g. first visit from web app), attempt to
  // restore session via the httpOnly cookie that both apps share at the API origin.
  useEffect(() => {
    if (!isHydrated || isAuthenticated || cookieChecked) return

    setIsCheckingCookie(true)
    // Step 1: Refresh tokens first — ensures access_token is fresh and gets CSRF token.
    // /auth/me is an auth endpoint so the Axios interceptor won't auto-retry on 401;
    // calling /auth/refresh first avoids that limitation.
    api
      .post<{ csrfToken?: string }>('/auth/refresh', {})
      .then(async ({ data: refreshData }) => {
        if (refreshData.csrfToken) {
          setCsrfToken(refreshData.csrfToken)
        }
        // Step 2: Fetch user data with the fresh access_token
        const { data: meData } = await api.get<{ user: AdminUser }>('/auth/me')
        if (meData.user) {
          setAuth(meData.user)
        }
      })
      .catch(() => {
        // No valid session (refresh_token expired or absent) — redirect to /login below
      })
      .finally(() => {
        setIsCheckingCookie(false)
        setCookieChecked(true)
      })
  }, [isHydrated, isAuthenticated, cookieChecked, setAuth])

  // 等待 Zustand hydration 或 cookie 驗證完成
  if (!isHydrated || isCheckingCookie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  // 未登入，導向登入頁
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 登入但不是管理員
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">權限不足</h2>
            <p className="text-red-600 mb-4">您沒有管理員權限，無法存取此頁面。</p>
            <button
              onClick={() => {
                useAuthStore.getState().logout()
                window.location.href = '/login'
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新登入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
