'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Crown, Award, Star } from 'lucide-react'
import { useCartStore, useTotalItems, useTotalPrice } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/feedback/toast'
import { Breadcrumb } from '@/components/ui/navigation'
import { cn } from '@/lib/utils'
import type { MemberLevel } from '@haude/types'

// 會員折扣本地配置（與後端 MemberLevelConfig 同步）
const MEMBER_DISCOUNT_CONFIG: Record<MemberLevel, {
  discountPercent: number
  displayName: string
  freeShipping: boolean
  icon: typeof Crown
  color: string
}> = {
  NORMAL: { discountPercent: 0, displayName: '普通會員', freeShipping: false, icon: Star, color: 'text-gray-500' },
  BRONZE: { discountPercent: 5, displayName: '銅卡會員', freeShipping: false, icon: Award, color: 'text-amber-600' },
  SILVER: { discountPercent: 10, displayName: '銀卡會員', freeShipping: false, icon: Award, color: 'text-slate-500' },
  GOLD: { discountPercent: 15, displayName: '金卡會員', freeShipping: true, icon: Crown, color: 'text-yellow-600' },
}

/**
 * 購物車頁面
 *
 * 功能：
 * - 顯示購物車內容
 * - 修改數量、刪除商品
 * - 結帳流程入口
 */
export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { error: showError } = useToast()
  const totalItems = useTotalItems()
  const totalPrice = useTotalPrice()

  // Wrap async cart actions with error handling to prevent unhandled promise rejections
  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateQuantity(productId, quantity)
    } catch {
      showError('更新數量失敗', '請稍後再試')
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeItem(productId)
    } catch {
      showError('移除商品失敗', '請稍後再試')
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
    } catch {
      showError('清空購物車失敗', '請稍後再試')
    }
  }

  // 取得會員等級與折扣資訊
  const memberLevel = (user?.memberLevel || 'NORMAL') as MemberLevel
  const memberConfig = MEMBER_DISCOUNT_CONFIG[memberLevel]
  const memberDiscount = Math.floor(totalPrice * memberConfig.discountPercent / 100)
  const hasMemberDiscount = isAuthenticated && memberConfig.discountPercent > 0
  const hasFreeShipping = isAuthenticated && memberConfig.freeShipping
  const MemberIcon = memberConfig.icon

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 空購物車 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: '購物車' }]} className="mb-8" />
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">購物車是空的</h2>
            <p className="text-gray-500 mb-8">快去挑選喜歡的商品吧！</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              瀏覽產品
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: '購物車' }]} className="mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 購物車項目列表 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                {/* 商品圖片 */}
                <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    NT$ {item.price.toLocaleString()}
                  </p>

                  {/* 數量控制 */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className={cn(
                        'p-1 rounded border',
                        item.quantity <= 1
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 rounded border border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 小計和刪除 */}
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="mt-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* 清空購物車 */}
            <div className="text-right">
              <button
                onClick={handleClearCart}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                清空購物車
              </button>
            </div>
          </div>

          {/* 訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <h2 className="text-lg font-medium text-gray-900 mb-4">訂單摘要</h2>

              <div className="space-y-3 text-sm">
                {/* 會員等級標籤 */}
                {isAuthenticated && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    memberConfig.discountPercent > 0 ? 'bg-green-50' : 'bg-gray-50'
                  )}>
                    <MemberIcon className={cn('w-4 h-4', memberConfig.color)} />
                    <span className={cn('text-sm font-medium', memberConfig.color)}>
                      {memberConfig.displayName}
                    </span>
                    {memberConfig.discountPercent > 0 && (
                      <span className="text-green-600 text-xs ml-auto">
                        享 {100 - memberConfig.discountPercent} 折
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>小計 ({totalItems} 件)</span>
                  <span>NT$ {totalPrice.toLocaleString()}</span>
                </div>

                {/* 會員折扣 */}
                {hasMemberDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>會員折扣 ({100 - memberConfig.discountPercent} 折)</span>
                    <span>-NT$ {memberDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>運費</span>
                  <span className={hasFreeShipping ? 'text-green-600' : ''}>
                    {hasFreeShipping ? '金卡免運' : '免運費'}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between font-medium text-lg">
                  <span>總計</span>
                  <span className="text-green-600">
                    NT$ {(totalPrice - memberDiscount).toLocaleString()}
                  </span>
                </div>

                {/* 未登入提示 */}
                {!isAuthenticated && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    <Link href="/login" className="text-green-600 hover:underline">
                      登入
                    </Link>
                    {' '}後可享會員專屬折扣
                  </div>
                )}
              </div>

              <Link
                href="/checkout"
                className="block w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
              >
                前往結帳
              </Link>

              <Link
                href="/products"
                className="block text-center mt-4 text-sm text-green-600 hover:underline"
              >
                繼續購物
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
