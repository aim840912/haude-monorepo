'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { API_URL } from '@/lib/api-url'
import { Mail, Lock, LogIn } from 'lucide-react'

function LoginForm() {
  const isDev = process.env.NODE_ENV === 'development'
  const [email, setEmail] = useState(isDev ? 'demo@haude.com' : '')
  const [password, setPassword] = useState(isDev ? 'demo123' : '')
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoading, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawFrom = searchParams.get('from') || '/'
  // Validate redirect target is a relative path to prevent open redirect attacks.
  // Rejects absolute URLs (https://evil.com) and protocol-relative URLs (//evil.com).
  const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password, rememberMe)
      router.push(from)
    } catch {
      // Error is handled by useAuth hook
    }
  }

  // 開發環境快速登入
  const handleQuickLogin = async (quickEmail: string, quickPassword: string) => {
    try {
      await login(quickEmail, quickPassword, false)
      router.push(from)
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
              <Link href="/register" className="text-primary-tea hover:text-primary-tea-hover font-medium">
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
                  placeholder="********"
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
                <Link href="/forgot-password" className="text-primary-tea hover:text-primary-tea-hover">
                  忘記密碼？
                </Link>
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

            {/* 分隔線 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用以下方式登入</span>
              </div>
            </div>

            {/* Google 登入按鈕 */}
            <a
              href={`${API_URL}/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-tea"
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
            </a>
          </form>

          {/* 開發環境快速登入按鈕 */}
          {isDev && (
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
          <Link href="/" className="text-primary-tea hover:text-primary-tea-hover">
            ← 返回首頁
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-tea"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
