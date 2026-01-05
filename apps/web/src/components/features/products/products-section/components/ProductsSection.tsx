import React from 'react'
import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useVisibility } from '../hooks/useVisibility'
import { ProductCard } from '../../ProductCard'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { SectionHeader } from './SectionHeader'
import { ViewAllButton } from './ViewAllButton'

interface ProductsSectionProps {
  /** 顯示數量限制 */
  limit?: number
  /** 標題 */
  title?: string
  /** 副標題 */
  subtitle?: string
}

/**
 * 產品區段元件
 *
 * 用於首頁展示精選產品，包含：
 * - 區段標題
 * - 產品卡片網格
 * - 查看全部按鈕
 * - 載入、錯誤、空狀態處理
 */
export function ProductsSection({
  limit = 3,
  title,
  subtitle,
}: ProductsSectionProps) {
  const { products, isLoading, error, refetch } = useProducts()
  const { isVisible, ref } = useVisibility()

  // 限制顯示數量
  const displayProducts = products.slice(0, limit)

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  return (
    <section
      id="products"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-16 px-6 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          isVisible={isVisible}
          title={title}
          subtitle={subtitle}
        />

        {displayProducts.length > 0 ? (
          <>
            <div
              className={cn(
                'flex flex-wrap justify-center gap-8 mb-12',
                isVisible && 'animate-fade-in'
              )}
            >
              {displayProducts.map(product => (
                <div
                  key={product.id}
                  className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-sm"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <ViewAllButton isVisible={isVisible} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}

ProductsSection.displayName = 'ProductsSection'
