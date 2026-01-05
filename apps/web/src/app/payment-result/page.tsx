'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, ArrowRight, Home, Package } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

/**
 * 付款結果內容
 */
function PaymentResultContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const status = searchParams.get('status')
  const message = searchParams.get('message')

  const { order, isLoading } = useOrder(orderId || undefined)

  const isSuccess = status === 'success'

  // 載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* 狀態圖示 */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600" />
          )}
        </div>

        {/* 標題 */}
        <h1
          className={`text-2xl font-bold mb-2 ${
            isSuccess ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {isSuccess ? '付款成功' : '付款失敗'}
        </h1>

        {/* 訊息 */}
        <p className="text-gray-600 mb-6">
          {isSuccess
            ? '感謝您的購買！我們會盡快處理您的訂單。'
            : message || '付款過程發生錯誤，請稍後再試。'}
        </p>

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
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
        {!isSuccess && orderId && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">
              如需重新付款，請前往訂單詳情頁
            </p>
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
 * 用戶從藍新付款完成後會被導向到這裡
 * URL 格式：/payment-result?orderId=xxx&status=success|fail&message=xxx
 */
export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  )
}
