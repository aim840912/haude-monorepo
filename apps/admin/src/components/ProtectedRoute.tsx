import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isAdmin, isHydrated } = useAuthStore()

  // 等待 hydration 完成
  if (!isHydrated) {
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
