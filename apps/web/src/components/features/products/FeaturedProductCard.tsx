'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLACEHOLDER_IMAGES } from '@/config/placeholder.config'
import type { Product } from '@/types/product'

interface FeaturedProductCardProps {
  /** Product data */
  product: Product
  /** Click handler */
  onProductClick?: (product: Product) => void
}

/**
 * Featured product hero card with horizontal layout (image left, content right).
 * Mobile: vertical stack (image top, content bottom).
 */
export function FeaturedProductCard({
  product,
  onProductClick,
}: FeaturedProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const primaryImage = product.images[0]
  const imageUrl = primaryImage?.storageUrl || PLACEHOLDER_IMAGES.product(product.category)

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const stock = product.stock

  const handleClick = () => {
    onProductClick?.(product)
  }

  return (
    <div
      className={cn(
        'group relative bg-card-bg overflow-hidden rounded-2xl',
        'shadow-lg hover:shadow-xl',
        'border border-card-border',
        'transition-all duration-300',
        'cursor-pointer',
        'tea-card'
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image section — 55% width on desktop, full width on mobile */}
        <div className="relative md:w-[55%] flex-shrink-0">
          {/* 16:10 aspect ratio */}
          <div className="relative pb-[62.5%] md:pb-0 md:h-full md:min-h-[320px] bg-card-bg-secondary">
            {!imageError ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <Image
                src={PLACEHOLDER_IMAGES.product(product.category)}
                alt={`${product.category} - 暫無圖片`}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
            )}
          </div>

          {/* Discount badge */}
          {discountPercent > 0 && (
            <div className="absolute top-4 left-4 z-10 inline-flex items-center bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-current flex-shrink-0" />
              <span>特價 -{discountPercent}%</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          {/* Category label */}
          <span className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
            {product.category}
          </span>

          {/* Product name */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3 group-hover:text-primary-tea transition-colors duration-300">
            {product.name}
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-sm md:text-base leading-relaxed line-clamp-3 mb-4">
            {product.description}
          </p>

          {/* Stock indicator */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            {stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-primary-green">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                有現貨
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-accent-red">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                缺貨中
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold text-primary-tea">
              NT$ {product.price.toLocaleString()}
            </span>
            {product.priceUnit && (
              <span className="text-sm text-text-secondary">/ {product.priceUnit}</span>
            )}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-text-tertiary line-through">
                NT$ {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* CTA button */}
          <div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-tea text-white rounded-full text-sm font-medium group-hover:gap-3 transition-all duration-300">
              查看詳情
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
