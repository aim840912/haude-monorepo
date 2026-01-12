'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useCheckoutForm } from './hooks'
import {
  ShippingAddressForm,
  PaymentMethodSelector,
  OrderSummary,
} from './components'

/**
 * 結帳頁面
 *
 * 功能：
 * - 顯示購物車摘要
 * - 填寫收件人資訊
 * - 選擇付款方式
 * - 建立訂單
 *
 * 注意：需要登入才能結帳（使用 ProtectedRoute 包裹）
 */
export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  )
}

/**
 * 結帳頁面內容元件
 */
function CheckoutContent() {
  const router = useRouter()
  const {
    // 狀態
    shippingAddress,
    paymentMethod,
    orderNotes,
    errors,
    isSubmitting,
    // 購物車資料
    items,
    totalItems,
    totalPrice,
    // 處理函式
    handleAddressChange,
    handlePaymentMethodChange,
    setOrderNotes,
    handleSubmit,
  } = useCheckoutForm()

  // 購物車為空
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">購物車是空的</h2>
        <p className="text-gray-500 mb-6">請先將商品加入購物車</p>
        <Link
          href="/products"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          瀏覽產品
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <div className="bg-white border-b sticky top-[var(--header-height)] z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回購物車</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-lg font-medium text-gray-900">結帳</h1>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左側：表單區 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 收件人資訊 */}
              <ShippingAddressForm
                shippingAddress={shippingAddress}
                errors={errors}
                onAddressChange={handleAddressChange}
              />

              {/* 付款方式 */}
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              />

              {/* 訂單備註 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">訂單備註（選填）</h2>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="有什麼需要告訴我們的嗎？"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            {/* 右側：訂單摘要 */}
            <div className="lg:col-span-1">
              <OrderSummary
                items={items}
                totalItems={totalItems}
                totalPrice={totalPrice}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
