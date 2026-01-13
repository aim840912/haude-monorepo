import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface ProductFilterProps {
  /** 搜尋關鍵字 */
  searchQuery: string
  /** 搜尋關鍵字變更 */
  onSearchChange: (query: string) => void
  /** 選中的類別 */
  selectedCategory: string
  /** 類別變更 */
  onCategoryChange: (category: string) => void
  /** 可用的類別列表 */
  categories: string[]
  /** 排序方式 */
  sortBy: string
  /** 排序變更 */
  onSortChange: (sort: string) => void
  /** 是否載入中 */
  isLoading?: boolean
}

const sortOptions = [
  { value: 'newest', label: '最新上架' },
  { value: 'price-low', label: '價格低到高' },
  { value: 'price-high', label: '價格高到低' },
  { value: 'name', label: '名稱排序' },
]

/**
 * 產品篩選元件
 *
 * 功能：
 * - 關鍵字搜尋（含防抖）
 * - 類別篩選
 * - 排序選擇
 * - 響應式設計
 */
export function ProductFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  isLoading = false,
}: ProductFilterProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // 防抖搜尋
  const debouncedSearch = useDebounce(localSearch, 300)

  // 當防抖值變化時通知父元件
  useState(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch)
    }
  })

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    // 立即更新父元件以支援即時回饋
    onSearchChange(value)
  }

  const clearSearch = () => {
    setLocalSearch('')
    onSearchChange('')
  }

  const clearFilters = () => {
    setLocalSearch('')
    onSearchChange('')
    onCategoryChange('')
    onSortChange('newest')
  }

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== 'newest'

  return (
    <div className="space-y-4">
      {/* 搜尋列 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜尋框 */}
        <div className="flex-1 relative">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
              isLoading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            )}
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜尋產品..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="清除搜尋"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 篩選切換按鈕（行動版） */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'sm:hidden flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors',
            showFilters
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>篩選</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
        </button>

        {/* 排序（桌面版） */}
        <div className="hidden sm:block">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 篩選區域（可展開） */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          showFilters ? 'max-h-96' : 'max-h-0 sm:max-h-96'
        )}
      >
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* 類別篩選 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">類別</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onCategoryChange('')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors',
                  selectedCategory === ''
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                )}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    selectedCategory === category
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 排序（行動版） */}
          <div className="sm:hidden">
            <h4 className="text-sm font-medium text-gray-700 mb-2">排序</h4>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 清除篩選 */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                清除所有篩選
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
