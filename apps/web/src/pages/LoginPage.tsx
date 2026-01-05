import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, LogIn } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState(import.meta.env.DEV ? 'demo@haude.com' : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? 'demo123' : '')
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password, rememberMe)
      navigate(from, { replace: true })
    } catch {
      // Error is handled by useAuth hook
    }
  }

  // 開發環境快速登入
  const handleQuickLogin = async (quickEmail: string, quickPassword: string) => {
    try {
      await login(quickEmail, quickPassword, false)
      navigate(from, { replace: true })
    } catch {
      // Error is handled by useAuth hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground font-display">登入</h2>
            <p className="mt-2 text-sm text-text-secondary">
              還沒有帳號？{' '}
              <Link to="/register" className="text-primary-tea hover:text-primary-tea-hover font-medium">
                註冊帳號
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                電子郵件
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-tea focus:ring-primary-tea-light border-card-border rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                  記住我
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-primary-tea hover:text-primary-tea-hover">
                  忘記密碼？
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登入
                </>
              )}
            </button>
          </form>

          {/* 開發環境快速登入按鈕 */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">開發環境快速登入</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('demo@haude.com', 'demo123')}
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  一般用戶
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@haude.com', 'admin123')}
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  管理員
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-text-tertiary">
          <Link to="/" className="text-primary-tea hover:text-primary-tea-hover">
            ← 返回首頁
          </Link>
        </p>
      </div>
    </div>
  )
}
