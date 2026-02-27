'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ProductGrid } from '@/components/features/products/ProductGrid'
import { ProductFilter } from '@/components/features/products/ProductFilter'
import { FeaturedProductCard } from '@/components/features/products/FeaturedProductCard'
import { Breadcrumb } from '@/components/ui/navigation'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useProducts, useCategories } from '@/hooks/useProducts'
import type { Product } from '@haude/types'

/**
 * Products showcase page — brand-focused layout.
 *
 * First product displayed as a hero card, remaining products in a 3-column grid.
 * Category-only filtering, no search or sort.
 */
export default function ProductsPage() {
  const router = useRouter()
  const { products, isLoading, error } = useProducts()
  const { categories } = useCategories()

  const [selectedCategory, setSelectedCategory] = useState('')

  // Category filtering only
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((product) => product.category === selectedCategory)
  }, [products, selectedCategory])

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center justify-center text-center">
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
            <h3 className="text-lg font-medium text-foreground mb-2">載入失敗</h3>
            <p className="text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brand header */}
        <section className="text-center mb-12">
          <Breadcrumb
            items={[{ label: '產品' }]}
            className="mb-8 justify-center"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            嚴選茶品
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-lg mx-auto mb-8">
            座落梅山群峰，以自然農法呈現四季最美的滋味
          </p>

          {/* Category filter pills */}
          {categories.length > 0 && (
            <ProductFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />
          )}
        </section>

        {/* Layout: hero + grid when >3 products, grid-only when ≤3 */}
        {filteredProducts.length > 3 ? (
          <>
            {/* Featured product (first product as hero) */}
            <section className="mb-10">
              <FeaturedProductCard
                product={filteredProducts[0]}
                onProductClick={handleProductClick}
              />
            </section>

            {/* Remaining products grid */}
            <section>
              <ProductGrid
                products={filteredProducts.slice(1)}
                onProductClick={handleProductClick}
              />
            </section>
          </>
        ) : filteredProducts.length > 0 ? (
          /* Few products — grid only, no hero split */
          <section>
            <ProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
            />
          </section>
        ) : null}

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-card-bg-secondary rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-text-tertiary"
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
            <h3 className="text-lg font-medium text-foreground mb-2">
              {selectedCategory ? '此類別暫無產品' : '目前沒有產品'}
            </h3>
            <p className="text-text-secondary">請稍後再來查看</p>
          </div>
        )}
      </div>
    </div>
  )
}
