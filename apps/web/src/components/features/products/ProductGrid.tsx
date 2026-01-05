import { ProductCard } from './ProductCard'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import type { Product } from '@/types/product'

interface ProductGridProps {
  /** 產品列表 */
  products: Product[]
  /** 載入狀態 */
  isLoading?: boolean
  /** 錯誤訊息 */
  error?: string | null
  /** 感興趣的產品 ID 列表 */
  interestedIds?: string[]
  /** 產品點擊事件 */
  onProductClick?: (product: Product) => void
  /** 興趣切換事件 */
  onToggleInterest?: (productId: string) => void
  /** 空狀態文字 */
  emptyMessage?: string
}

/**
 * 產品網格元件
 *
 * 響應式佈局：
 * - 手機：1 列
 * - 平板：2 列
 * - 桌面：3-4 列
 */
export function ProductGrid({
  products,
  isLoading = false,
  error = null,
  interestedIds = [],
  onProductClick,
  onToggleInterest,
  emptyMessage = '目前沒有產品',
}: ProductGridProps) {
  // 載入狀態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  // 空狀態
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-500">請稍後再來查看</p>
      </div>
    )
  }

  // 產品網格
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isInterested={interestedIds.includes(product.id)}
          onProductClick={onProductClick}
          onToggleInterest={onToggleInterest}
        />
      ))}
    </div>
  )
}
