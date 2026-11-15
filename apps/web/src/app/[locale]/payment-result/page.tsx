'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, ArrowRight, Home, Package } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { resolvePaymentResult, type PaymentResult } from '@/lib/payment-result'

/** Fixed copy per outcome. Nothing from the URL is ever shown. */
const RESULT_VIEW: Record<
  PaymentResult,
  { title: string; message: string; tone: 'green' | 'red' | 'amber'; Icon: typeof CheckCircle }
> = {
  success: {
    title: '付款成功',
    message: '感謝您的購買！我們會盡快處理您的訂單。',
    tone: 'green',
    Icon: CheckCircle,
  },
  failed: {
    title: '付款失敗',
    message: '付款未完成，請到訂單詳情頁重新付款。',
    tone: 'red',
    Icon: XCircle,
  },
  confirming: {
    title: '付款確認中',
    message: '我們正在向金流確認付款結果，通常幾分鐘內完成，請稍後重新整理。',
    tone: 'amber',
    Icon: Clock,
  },
  unknown: {
    title: '請查看訂單狀態',
    message: '無法確認這筆付款的結果，請到「我的訂單」查看最新狀態。',
    tone: 'amber',
    Icon: Clock,
  },
}

const TONE_CLASSES = {
  green: { circle: 'bg-green-100', icon: 'text-green-600', title: 'text-green-900' },
  red: { circle: 'bg-red-100', icon: 'text-red-600', title: 'text-red-900' },
  amber: { circle: 'bg-amber-100', icon: 'text-amber-600', title: 'text-amber-900' },
} as const

/**
 * 付款結果內容
 */
function PaymentResultContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const { order, isLoading, refetch } = useOrder(orderId || undefined)

  // 結果一律以後端訂單的付款狀態為準，不讀網址上的 status / message
  const result = resolvePaymentResult(order)
  const view = RESULT_VIEW[result]
  const tone = TONE_CLASSES[view.tone]

  // 只在第一次載入時整頁轉圈；「重新查詢」時保留現有結果，避免畫面閃掉
  if (isLoading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* 狀態圖示 */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${tone.circle}`}
        >
          <view.Icon className={`w-12 h-12 ${tone.icon}`} aria-hidden="true" />
        </div>

        {/* 標題 */}
        <h1 className={`text-2xl font-bold mb-2 ${tone.title}`}>{view.title}</h1>

        {/* 訊息 */}
        <p className="text-gray-600 mb-6" aria-live="polite">
          {view.message}
        </p>

        {result === 'confirming' && (
          <button
            type="button"
            onClick={() => void refetch()}
            className="mb-6 text-green-700 hover:text-green-800 font-medium focus-visible:ring-2 focus-visible:ring-green-600 rounded"
          >
            重新查詢付款結果
          </button>
        )}

        {/* 訂單資訊 */}
        {order && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">訂單編號</span>
              <span className="font-medium text-gray-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">訂單金額</span>
              <span className="font-bold text-green-900">
                NT$ {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="space-y-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#1b5e20] text-white rounded-lg hover:bg-[#2e7d32] transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>查看訂單詳情</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>我的訂單</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>返回首頁</span>
          </Link>
        </div>

        {/* 失敗時顯示重試提示 */}
        {result === 'failed' && orderId && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">如需重新付款，請前往訂單詳情頁</p>
            <Link
              href={`/orders/${orderId}`}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              重新付款
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 付款結果頁
 *
 * 用戶從綠界付款完成後會被導向到這裡：/payment-result?orderId=xxx
 * 網址上即使帶有 status / message 也一律忽略（任何人都能偽造連結）。
 */
export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  )
}
