import { useState, useMemo } from 'react'
import { SafeImage } from '@/components/ui/SafeImage'
import { Pencil, Trash2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { AdminProductFilter } from './AdminProductFilter'
import type { AdminFilterState, AdminProductsTableProps } from './types'
import { DEFAULT_ADMIN_FILTERS } from './types'
import type { Product } from '@haude/types'

/**
 * 管理員產品表格元件
 *
 * 顯示產品列表並提供：
 * - 篩選功能
 * - 分頁功能
 * - 編輯、刪除、上下架操作
 */
export function AdminProductsTable({
  onDelete,
  onToggleActive,
  onEdit,
}: AdminProductsTableProps) {
  const { products, isLoading, error, refetch } = useProducts({ activeOnly: false })
  const { categories } = useCategories()
  const [filters, setFilters] = useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 篩選和排序產品
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 搜尋篩選
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      )
    }

    // 類別篩選
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category))
    }

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      result = result.filter(p => p.stock > 0)
    } else if (filters.availability === 'out_of_stock') {
      result = result.filter(p => p.stock <= 0)
    }

    // 上架狀態篩選
    if (filters.status === 'active') {
      result = result.filter(p => p.isActive)
    } else if (filters.status === 'inactive') {
      result = result.filter(p => !p.isActive)
    }

    // 排序
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'inventory':
          return b.stock - a.stock
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'created_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [products, filters])

  // 分頁
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: AdminFilterState) => {
    setFilters(newFilters)
    setCurrentPage(1) // 篩選改變時重置到第一頁
  }

  const handleDelete = (product: Product) => {
    if (onDelete && confirm(`確定要刪除「${product.name}」嗎？`)) {
      onDelete(product.id)
    }
  }

  const handleToggleActive = (product: Product) => {
    if (onToggleActive) {
      onToggleActive(product.id, !product.isActive)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 篩選器 */}
      <AdminProductFilter
        onFilterChange={handleFilterChange}
        availableCategories={categories}
        productCount={filteredProducts.length}
        totalCount={products.length}
        loading={isLoading}
      />

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">產品</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">類別</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">價格</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">庫存</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">狀態</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    沒有符合條件的產品
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {/* 產品資訊 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {product.images[0] ? (
                            <SafeImage
                              src={product.images[0].storageUrl}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              無圖
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 類別 */}
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {product.category}
                      </span>
                    </td>

                    {/* 價格 */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-gray-900">
                        NT$ {product.price.toLocaleString()}
                      </span>
                    </td>

                    {/* 庫存 */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          'font-medium',
                          product.stock <= 0
                            ? 'text-red-600'
                            : product.stock < 10
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        )}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* 狀態 */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {product.isActive ? '已上架' : '未上架'}
                      </span>
                    </td>

                    {/* 操作 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(product.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="編輯"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onToggleActive && (
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              product.isActive
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-green-600 hover:bg-green-50'
                            )}
                            title={product.isActive ? '下架' : '上架'}
                          >
                            {product.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              第 {currentPage} 頁，共 {totalPages} 頁
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
