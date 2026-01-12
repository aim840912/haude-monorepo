'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, AlertCircle, ArrowLeft, X, Check } from 'lucide-react'
import { api } from '@/services/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  // 驗證 Token
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('缺少重設連結，請從郵件中的連結重新進入')
        setIsVerifying(false)
        return
      }

      try {
        await api.get(`/auth/verify-reset-token?token=${token}`)
        setIsVerifying(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : '連結無效或已過期'
        setTokenError(message)
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 驗證密碼
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
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      })
      setIsSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '重設密碼失敗，請稍後再試'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading 狀態
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-tea mx-auto"></div>
          <p className="mt-4 text-text-secondary">驗證重設連結中...</p>
        </div>
      </div>
    )
  }

  // Token 無效
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-display mb-4">
              連結無效
            </h2>
            <p className="text-text-secondary mb-6">
              {tokenError}
            </p>
            <Link
              href="/forgot-password"
              className="btn btn-primary w-full"
            >
              重新申請重設連結
            </Link>
            <Link
              href="/login"
              className="mt-4 block text-sm text-primary-tea hover:text-primary-tea-hover"
            >
              返回登入
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 重設成功
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-display mb-4">
              密碼已重設
            </h2>
            <p className="text-text-secondary mb-6">
              您的密碼已成功更新，請使用新密碼登入
            </p>
            <button
              onClick={() => router.push('/login')}
              className="btn btn-primary w-full"
            >
              前往登入
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 重設表單
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground font-display">設定新密碼</h2>
            <p className="mt-2 text-sm text-text-secondary">
              請輸入您的新密碼
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="label">
                新密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="至少 6 個字元"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                確認新密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input pl-10 ${
                    confirmPassword === ''
                      ? ''
                      : password === confirmPassword
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                        : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder="再次輸入新密碼"
                  minLength={6}
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
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                '重設密碼'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary-tea hover:text-primary-tea-hover flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登入
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-tea"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
