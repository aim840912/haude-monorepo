'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { ArrowLeft, Lock, CheckCircle, Shield, X, Check } from 'lucide-react'

interface UserInfo {
  hasPassword: boolean
  isGoogleUser: boolean
}

export default function SecurityPage() {
  const router = useRouter()
  const { user, isAuthenticated, token } = useAuthStore()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/security')
      return
    }

    // 獲取用戶詳細資訊
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/me')
        setUserInfo({
          hasPassword: response.data.user.hasPassword,
          isGoogleUser: response.data.user.isGoogleUser,
        })
      } catch {
        // 錯誤處理
      }
    }

    fetchUserInfo()
  }, [isAuthenticated, router, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      return
    }

    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/set-password', { password })
      setIsSuccess(true)
      // 更新本地狀態
      setUserInfo((prev) => prev ? { ...prev, hasPassword: true } : null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '設定密碼失敗，請稍後再試'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 返回連結 */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回帳號設定
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">安全設定</h1>
              <p className="text-gray-500">管理您的登入方式</p>
            </div>
          </div>

          {/* 登入方式資訊 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-medium text-gray-900 mb-2">目前登入方式</h2>
            <div className="space-y-2">
              {userInfo?.isGoogleUser && (
                <div className="flex items-center gap-2 text-gray-600">
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
                  <span>Google 帳號已連結</span>
                </div>
              )}
              {userInfo?.hasPassword && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Lock className="w-5 h-5 text-green-600" />
                  <span>密碼登入已啟用</span>
                </div>
              )}
            </div>
          </div>

          {/* 設定密碼區塊 */}
          {userInfo?.isGoogleUser && !userInfo?.hasPassword && !isSuccess && (
            <div className="border-t pt-6">
              <h2 className="font-medium text-gray-900 mb-4">設定密碼</h2>
              <p className="text-sm text-gray-500 mb-4">
                設定密碼後，您可以選擇使用 Google 或 Email/密碼 登入。
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    新密碼
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="至少 6 個字元"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    確認密碼
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 ${
                        confirmPassword === ''
                          ? 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                          : password === confirmPassword
                            ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                            : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      }`}
                      placeholder="再次輸入密碼"
                      minLength={6}
                      required
                    />
                  </div>
                  {/* 即時驗證提示 */}
                  {confirmPassword !== '' && (
                    <div className={`mt-1 flex items-center gap-1 text-sm ${
                      password === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {password === confirmPassword ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>密碼相符</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>密碼不一致</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      設定中...
                    </div>
                  ) : (
                    '設定密碼'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 成功訊息 */}
          {isSuccess && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">密碼設定成功！</p>
                  <p className="text-sm text-green-600">
                    現在您可以使用 Email 和密碼登入，也可以繼續使用 Google 登入。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 已有密碼的用戶 */}
          {userInfo?.hasPassword && !isSuccess && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-800">密碼已設定</p>
                  <p className="text-sm text-gray-600">
                    您可以使用 Email 和密碼登入。如需修改密碼，請使用「忘記密碼」功能。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
