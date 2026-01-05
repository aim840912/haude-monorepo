import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductGrid } from '@/components/features/products/ProductGrid'
import { ProductFilter } from '@/components/features/products/ProductFilter'
import { PageHeader } from '@/components/ui/sections'
import { useProducts, useCategories } from '@/hooks/useProducts'
import type { Product } from '@/types/product'

/**
 * 產品列表頁
 *
 * 功能：
 * - 顯示所有產品
 * - 搜尋、篩選、排序
 * - 點擊產品進入詳情頁
 */
export function ProductsPage() {
  const navigate = useNavigate()
  const { products, isLoading, error } = useProducts()
  const { categories } = useCategories()

  // 篩選狀態
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // 篩選和排序產品
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
    }

    // 類別篩選
    if (selectedCategory) {
      result = result.filter((product) => product.category === selectedCategory)
    }

    // 排序
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return result
  }, [products, searchQuery, selectedCategory, sortBy])

  const handleProductClick = (product: Product) => {
    navigate(`/products/${product.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="產品列表" subtitle="探索我們的優質農產品" />

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 篩選區 */}
        <div className="mb-8">
          <ProductFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isLoading={isLoading}
          />
        </div>

        {/* 結果統計 */}
        {!isLoading && !error && (
          <div className="mb-6 text-sm text-gray-600">
            找到 <span className="font-medium text-gray-900">{filteredProducts.length}</span> 個產品
            {selectedCategory && (
              <span>
                {' '}
                在 <span className="font-medium text-green-600">{selectedCategory}</span> 類別中
              </span>
            )}
          </div>
        )}

        {/* 產品網格 */}
        <ProductGrid
          products={filteredProducts}
          isLoading={isLoading}
          error={error}
          onProductClick={handleProductClick}
          emptyMessage={searchQuery || selectedCategory ? '沒有符合條件的產品' : '目前沒有產品'}
        />
      </div>
    </div>
  )
}
