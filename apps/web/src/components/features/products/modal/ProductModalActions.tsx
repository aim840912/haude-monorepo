import React, { useState } from 'react'
import { Share2, ShoppingCart, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/feedback/toast'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import type { ExtendedProduct } from './types'
import type { Product } from '@haude/types'
import logger from '@/lib/logger'

interface ProductModalActionsProps {
  /** 產品資訊 */
  product: ExtendedProduct
  /** 選擇的數量 */
  quantity: number
  /** 是否為感興趣的產品 */
  isInterested?: boolean
  /** 興趣切換回調 */
  onToggleInterest?: (productId: string, productName: string) => void
  /** 詢問報價回調 */
  onRequestQuote?: (product: ExtendedProduct) => Promise<void> | void
}

/**
 * 產品 Modal 操作按鈕群組元件
 *
 * 包含：
 * - 興趣按鈕（收藏）
 * - 分享按鈕
 * - 詢問報價按鈕
 * - 加入購物車按鈕
 */
export const ProductModalActions = React.memo<ProductModalActionsProps>(
  ({ product, quantity, isInterested = false, onToggleInterest, onRequestQuote }) => {
    const [isRequestingQuote, setIsRequestingQuote] = useState(false)
    const [isAddingToCart, setIsAddingToCart] = useState(false)
    const { success, info } = useToast()
    const { isAuthenticated } = useAuthStore()
    const { addItem, getItemQuantity } = useCartStore()

    // 取得購物車中此產品的數量
    const cartQuantity = getItemQuantity(product.id)
    // 取得庫存
    const availableStock = product.availableStock ?? product.stock ?? 0
    const isOutOfStock = availableStock <= 0
    // 缺貨文字（避免重複的三元運算式）
    const outOfStockText = (product.stock ?? 0) > 0 ? '庫存已保留' : '暫時缺貨'

    const handleRequestQuote = async () => {
      if (!onRequestQuote) return
      setIsRequestingQuote(true)
      try {
        await onRequestQuote(product)
      } finally {
        setIsRequestingQuote(false)
      }
    }

    const handleAddToCart = async () => {
      if (isOutOfStock) return

      setIsAddingToCart(true)
      try {
        // 將 ExtendedProduct 轉換為 Product 類型（使用展開運算子簡化）
        const now = new Date().toISOString()
        const productForCart: Product = {
          ...product,
          stock: product.stock ?? 0,
          images: product.images || [],
          description: product.description || '',
          category: product.category || '',
          isActive: true,
          createdAt: product.createdAt || now,
          updatedAt: product.updatedAt || now,
        }

        await addItem(productForCart, quantity)
      } catch (error) {
        logger.error('加入購物車失敗', { error })
      } finally {
        setIsAddingToCart(false)
      }
    }

    const handleShare = async () => {
      const shareUrl = `${window.location.origin}/products?id=${product.id}`
      const shareData = {
        title: product.name,
        text: `查看這個產品：${product.name}`,
        url: shareUrl,
      }

      try {
        if (navigator.share) {
          await navigator.share(shareData)
        } else {
          await navigator.clipboard.writeText(shareUrl)
          success('連結已複製', '可以貼上分享給朋友')
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          info('分享連結', shareUrl)
        }
      }
    }

    const handleToggleInterest = () => {
      if (onToggleInterest) {
        onToggleInterest(product.id, product.name)
      }
    }

    return (
      <>
        {/* 次要操作按鈕 */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            {/* 興趣/收藏按鈕 */}
            <button
              type="button"
              onClick={handleToggleInterest}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg transition-[box-shadow,background-color,border-color,color] duration-200',
                'flex items-center justify-center gap-2',
                'shadow-md hover:shadow-lg',
                isInterested
                  ? 'bg-red-50 text-red-600 border border-red-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              )}
              aria-label={isInterested ? '取消收藏' : '加入收藏'}
            >
              <Heart className={cn('w-4 h-4', isInterested && 'fill-current')} />
              <span className="hidden sm:inline">{isInterested ? '已收藏' : '收藏'}</span>
            </button>

            {/* 分享按鈕 */}
            <button
              type="button"
              onClick={handleShare}
              className={cn(
                'px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg',
                'text-gray-700 hover:text-blue-600 transition-[color,box-shadow] duration-200',
                'shadow-md hover:shadow-lg flex items-center gap-2'
              )}
              aria-label="分享產品"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
        </div>

        {/* 主要操作按鈕 */}
        <div className="space-y-3">
          {/* 詢問報價按鈕 */}
          {onRequestQuote && (
            <button
              type="button"
              onClick={handleRequestQuote}
              disabled={isOutOfStock || isRequestingQuote || !isAuthenticated}
              className={cn(
                'w-full min-h-[48px] rounded-3xl',
                'flex items-center justify-center',
                'transition duration-300 ease-in-out',
                'transform hover:scale-[1.01] active:scale-[0.99]',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
                isOutOfStock || isRequestingQuote || !isAuthenticated
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              )}
            >
              {isOutOfStock ? (
                <span className="font-bold text-base">{outOfStockText}</span>
              ) : isRequestingQuote ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold text-base">處理中...</span>
                </div>
              ) : !isAuthenticated ? (
                <span className="font-bold text-base">請先登入才能詢問報價</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-base">詢問報價</span>
                  <span className="text-sm opacity-90">
                    NT$ {(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              )}
            </button>
          )}

          {/* 加入購物車按鈕 */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className={cn(
              'w-full min-h-[48px] rounded-3xl',
              'flex items-center justify-center',
              'transition duration-300 ease-in-out',
              'transform hover:scale-[1.01] active:scale-[0.99]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
              isOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                : 'bg-white cursor-pointer border-2 border-green-500 shadow-[inset_0px_-2px_0px_1px_#f59e0b] hover:bg-green-500 hover:text-white group'
            )}
          >
            <span
              className={cn(
                'font-medium flex items-center justify-center gap-2',
                isOutOfStock ? 'text-gray-500' : 'text-gray-800 group-hover:text-white'
              )}
            >
              {isOutOfStock ? (
                <span className="font-bold text-base">{outOfStockText}</span>
              ) : isAddingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold text-base">加入中...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-bold text-base">
                    {cartQuantity > 0
                      ? `已加入 (${cartQuantity}) - 再加 ${quantity}`
                      : `加入購物車 (${quantity})`}
                  </span>
                </>
              )}
            </span>
          </button>
        </div>
      </>
    )
  }
)

ProductModalActions.displayName = 'ProductModalActions'
