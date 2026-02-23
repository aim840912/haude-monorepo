import { useState } from 'react'
import Image from 'next/image'
import { Star, Heart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLACEHOLDER_IMAGES } from '@/config/placeholder.config'
import type { Product } from '@/types/product'

interface ProductCardProps {
  /** 產品資料 */
  product: Product
  /** 是否為感興趣的產品 */
  isInterested?: boolean
  /** 產品點擊事件 */
  onProductClick?: (product: Product) => void
  /** 興趣切換事件 */
  onToggleInterest?: (productId: string) => void
}

/**
 * 產品卡片組件
 *
 * 特色：
 * - 4:3 圖片比例
 * - 響應式設計（填滿 grid 欄位）
 * - Hover 效果
 * - 促銷標籤
 * - 友善庫存標示
 */
export function ProductCard({
  product,
  isInterested = false,
  onProductClick,
  onToggleInterest,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // 取得第一張圖片，沒有則使用分類專屬 placeholder
  const primaryImage = product.images[0]
  const imageUrl = primaryImage?.storageUrl || PLACEHOLDER_IMAGES.product(product.category)

  // 取得庫存
  const stock = product.stock

  // 計算折扣百分比
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const handleClick = () => {
    onProductClick?.(product)
  }

  const handleToggleInterest = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleInterest?.(product.id)
  }

  return (
    <div
      className={cn(
        'group relative bg-card-bg',
        'cursor-pointer overflow-hidden rounded-xl',
        'shadow-lg hover:shadow-xl',
        'border border-card-border',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:scale-[1.01]',
        'w-full',
        'tea-card'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 產品標籤系統 */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        {/* 促銷標籤 */}
        {discountPercent > 0 && (
          <div className="inline-flex items-center bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current flex-shrink-0" />
            <span>特價 -{discountPercent}%</span>
          </div>
        )}

        {/* 缺貨標籤 */}
        {stock <= 0 && (
          <div className="inline-flex items-center bg-gray-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span>缺貨中</span>
          </div>
        )}
      </div>

      {/* 收藏按鈕 */}
      {onToggleInterest && (
        <button
          onClick={handleToggleInterest}
          className={cn(
            'absolute top-4 right-4 z-20 w-10 h-10',
            'flex items-center justify-center rounded-full',
            'transition-all duration-300',
            isInterested
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-red-100 hover:text-red-500'
          )}
          aria-label={isInterested ? '移除收藏' : '加入收藏'}
        >
          <Heart className={cn('w-5 h-5', isInterested && 'fill-current')} />
        </button>
      )}

      {/* 產品圖片 */}
      <div className="relative overflow-hidden rounded-t-xl product-image-wrapper">
        <div className="pb-[75%] bg-card-bg-secondary relative">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            // 圖片載入失敗時，顯示分類專屬 placeholder
            <Image
              src={PLACEHOLDER_IMAGES.product(product.category)}
              alt={`${product.category} - 暫無圖片`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover"
            />
          )}
        </div>

        {/* 圖片遮罩 */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            'bg-black/20',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* 查看詳情按鈕 */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-gray-800">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">查看詳情</span>
          </div>
        </div>
      </div>

      {/* 產品資訊區域 */}
      <div className="p-4 space-y-2">
        {/* 類別 */}
        <span className="text-xs text-text-tertiary uppercase tracking-wider">{product.category}</span>

        {/* 產品名稱 */}
        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary-tea transition-colors duration-300 line-clamp-2">
          {product.name}
        </h3>

        {/* 產品描述 */}
        <p className="text-sm text-text-secondary line-clamp-2">
          {product.description}
        </p>

        {/* 價格區域 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 現價 */}
          <span className="text-lg font-bold text-primary-tea">
            NT$ {product.price.toLocaleString()}
            {product.priceUnit && (
              <span className="text-xs font-normal text-text-secondary ml-1">/ {product.priceUnit}</span>
            )}
          </span>

          {/* 原價 */}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-text-tertiary line-through">
              NT$ {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* 庫存狀態（友善標示） */}
        <div className="text-xs">
          {stock > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-primary-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              有現貨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-accent-red">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              缺貨中
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
