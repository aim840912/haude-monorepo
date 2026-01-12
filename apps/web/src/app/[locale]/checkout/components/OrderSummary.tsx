'use client'

import { useState } from 'react'
import { ShoppingBag, Loader2, Tag, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { discountsApi } from '@/services/api'
import { useCheckoutStore } from '@/stores/checkoutStore'
import type { CartItem } from '@/stores/cartStore'

interface OrderSummaryProps {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isSubmitting: boolean
}

/**
 * 訂單摘要元件（含折扣碼功能）
 */
export function OrderSummary({
  items,
  totalItems,
  totalPrice,
  isSubmitting,
}: OrderSummaryProps) {
  const {
    discountCode,
    discountInfo,
    isValidatingDiscount,
    setDiscountCode,
    setDiscountInfo,
    setIsValidatingDiscount,
    clearDiscount,
  } = useCheckoutStore()

  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')

  // 計算折扣後的總價
  const discountAmount = discountInfo?.valid ? discountInfo.discountAmount || 0 : 0
  const finalTotal = totalPrice - discountAmount

  // 驗證折扣碼
  const handleValidateDiscount = async () => {
    if (!inputCode.trim()) {
      setError('請輸入折扣碼')
      return
    }

    setError('')
    setIsValidatingDiscount(true)

    try {
      const { data } = await discountsApi.validate(inputCode.trim(), totalPrice)

      if (data.valid) {
        setDiscountCode(data.code || inputCode.trim())
        setDiscountInfo(data)
        setInputCode('')
      } else {
        setError(data.message || '折扣碼無效')
        setDiscountInfo(null)
      }
    } catch {
      setError('驗證失敗，請稍後再試')
      setDiscountInfo(null)
    } finally {
      setIsValidatingDiscount(false)
    }
  }

  // 移除折扣碼
  const handleRemoveDiscount = () => {
    clearDiscount()
    setError('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[calc(var(--header-height)+5rem)]">
      <h2 className="text-lg font-medium text-gray-900 mb-4">訂單摘要</h2>

      {/* 商品列表 */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {items.map(item => (
          <div key={item.id} className="flex gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                NT$ {item.price.toLocaleString()} x {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              NT$ {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 折扣碼區域 */}
      <div className="border-t pt-4 mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4" />
          折扣碼
        </label>

        {discountInfo?.valid ? (
          // 已套用折扣碼
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{discountCode}</span>
              {discountInfo.description && (
                <span className="text-xs text-green-600">({discountInfo.description})</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemoveDiscount}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // 折扣碼輸入
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="輸入折扣碼"
              className={cn(
                'flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              )}
              disabled={isValidatingDiscount}
            />
            <button
              type="button"
              onClick={handleValidateDiscount}
              disabled={isValidatingDiscount || !inputCode.trim()}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isValidatingDiscount || !inputCode.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              )}
            >
              {isValidatingDiscount ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '套用'
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      {/* 金額計算 */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>小計（{totalItems} 件）</span>
          <span>NT$ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>運費</span>
          <span className="text-green-600">免運費</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>折扣</span>
            <span>-NT$ {discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-medium text-lg">
          <span>總計</span>
          <span className="text-green-600">NT$ {finalTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* 提交按鈕 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full mt-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
          isSubmitting
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            處理中...
          </>
        ) : (
          '確認訂單'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        點擊「確認訂單」即表示您同意我們的服務條款和隱私政策
      </p>
    </div>
  )
}
