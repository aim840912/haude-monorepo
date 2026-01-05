import { useState, useCallback } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminFilterState, AdminProductFilterProps } from './types'
import { DEFAULT_ADMIN_FILTERS } from './types'

/**
 * 管理員產品篩選器元件
 *
 * 提供完整的產品篩選功能：
 * - 搜尋關鍵字
 * - 類別篩選
 * - 庫存和上架狀態篩選
 * - 排序功能
 */
export function AdminProductFilter({
  onFilterChange,
  availableCategories,
  productCount = 0,
  totalCount = 0,
  loading = false,
}: AdminProductFilterProps) {
  const [filters, setFilters] = useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS)
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.availability !== 'all' ||
    filters.status !== 'all'

  const updateFilters = useCallback(
    (newFilters: Partial<AdminFilterState>) => {
      setFilters(prev => {
        const updated = { ...prev, ...newFilters }
        onFilterChange(updated)
        return updated
      })
    },
    [onFilterChange]
  )

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_ADMIN_FILTERS)
    onFilterChange(DEFAULT_ADMIN_FILTERS)
  }, [onFilterChange])

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    updateFilters({ categories: newCategories })
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-lg mb-6', isExpanded ? 'p-6' : 'p-4')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">篩選器</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            顯示 {productCount} / {totalCount} 項
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋產品名稱..."
                value={filters.search}
                onChange={e => updateFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    filters.categories.includes(category)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">庫存狀態</label>
              <select
                value={filters.availability}
                onChange={e =>
                  updateFilters({ availability: e.target.value as AdminFilterState['availability'] })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="in_stock">有庫存</option>
                <option value="out_of_stock">缺貨</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上架狀態</label>
              <select
                value={filters.status}
                onChange={e =>
                  updateFilters({ status: e.target.value as AdminFilterState['status'] })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="active">已上架</option>
                <option value="inactive">未上架</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={e =>
                  updateFilters({ sortBy: e.target.value as AdminFilterState['sortBy'] })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_desc">最新建立</option>
                <option value="created_asc">最早建立</option>
                <option value="name">名稱 A-Z</option>
                <option value="price_low">價格低到高</option>
                <option value="price_high">價格高到低</option>
                <option value="inventory">庫存數量</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
