'use client'

import { ShoppingBag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/stores/cartStore'

interface OrderSummaryProps {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isSubmitting: boolean
}

/**
 * 訂單摘要元件
 */
export function OrderSummary({
  items,
  totalItems,
  totalPrice,
  isSubmitting,
}: OrderSummaryProps) {
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
        <div className="border-t pt-2 flex justify-between font-medium text-lg">
          <span>總計</span>
          <span className="text-green-600">NT$ {totalPrice.toLocaleString()}</span>
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
