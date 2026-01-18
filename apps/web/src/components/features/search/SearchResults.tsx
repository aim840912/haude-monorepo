import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, SlidersHorizontal, Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import type { SearchResult } from '@/types/search'

interface SearchResultsProps {
  /** 搜尋關鍵字 */
  query: string
  /** 自訂類名 */
  className?: string
}

/**
 * 搜尋結果元件
 */
export function SearchResults({ query, className }: SearchResultsProps) {
  const [showFilters, setShowFilters] = useState(false)
  const { results, response, isLoading, error, filters, updateFilters } = useSearch(query)

  // 渲染單個搜尋結果項目
  const renderResultItem = (result: SearchResult) => {
    const typeLabels: Record<SearchResult['type'], string> = {
      product: '產品',
      review: '評論',
      farmTour: '農場體驗',
      location: '地點',
    }

    const typeColors: Record<SearchResult['type'], string> = {
      product: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      farmTour: 'bg-green-100 text-green-800',
      location: 'bg-orange-100 text-orange-800',
    }

    return (
      <Link
        key={result.id}
        href={result.url}
        className={cn(
          'block p-6 bg-white rounded-lg border border-gray-200',
          'hover:border-green-300 hover:shadow-md transition-all duration-200'
        )}
      >
        <div className="flex gap-4">
          {/* 圖片 */}
          {result.image && (
            <div className="relative flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={result.image}
                alt={result.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                  {result.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {result.description}
                </p>

                {/* 標籤和類別 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs px-2 py-1 rounded-full', typeColors[result.type])}>
                    {typeLabels[result.type]}
                  </span>

                  {result.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {result.category}
                    </span>
                  )}
                </div>
              </div>

              {/* 價格或其他資訊 */}
              <div className="flex-shrink-0 text-right">
                {result.price && (
                  <div className="text-lg font-bold text-green-600 mb-1">
                    NT$ {result.price.toLocaleString()}
                  </div>
                )}
                {result.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    {result.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // 無搜尋關鍵字
  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">請輸入搜尋關鍵字</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 搜尋資訊和篩選器 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            '搜尋中...'
          ) : response ? (
            <>
              找到 <span className="font-medium">{response.total}</span> 個結果
              {response.processingTime && (
                <span className="ml-2">(耗時 {response.processingTime}ms)</span>
              )}
            </>
          ) : null}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm',
            'text-gray-600 hover:text-gray-900',
            'border border-gray-300 rounded-lg hover:border-gray-400',
            'transition-colors'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          篩選
        </button>
      </div>

      {/* 篩選器面板 */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 類型篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
              <div className="space-y-2">
                {(['product', 'farmTour', 'location'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters?.type?.includes(type) || false}
                      onChange={e => {
                        const currentTypes = filters?.type || []
                        const newTypes = e.target.checked
                          ? [...currentTypes, type]
                          : currentTypes.filter(t => t !== type)
                        updateFilters({
                          ...filters,
                          type: newTypes.length > 0 ? newTypes : undefined,
                        })
                      }}
                      className="mr-2 rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">
                      {type === 'product' ? '產品' : type === 'farmTour' ? '農場體驗' : '地點'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 價格範圍 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">價格範圍</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最低"
                  value={filters?.priceRange?.[0] || ''}
                  onChange={e => {
                    const min = parseInt(e.target.value) || 0
                    const max = filters?.priceRange?.[1] || 10000
                    updateFilters({
                      ...filters,
                      priceRange: [min, max],
                    })
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={filters?.priceRange?.[1] || ''}
                  onChange={e => {
                    const max = parseInt(e.target.value) || 10000
                    const min = filters?.priceRange?.[0] || 0
                    updateFilters({
                      ...filters,
                      priceRange: [min, max],
                    })
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* 最低評分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最低評分</label>
              <select
                value={filters?.minRating || ''}
                onChange={e => {
                  const minRating = parseFloat(e.target.value) || undefined
                  updateFilters({
                    ...filters,
                    minRating,
                  })
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              >
                <option value="">不限</option>
                <option value="4.5">4.5 星以上</option>
                <option value="4.0">4.0 星以上</option>
                <option value="3.5">3.5 星以上</option>
                <option value="3.0">3.0 星以上</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 載入狀態 */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-500">搜尋中...</p>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 搜尋結果 */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-4">{results.map(renderResultItem)}</div>
      )}

      {/* 無結果 */}
      {!isLoading && !error && results.length === 0 && response && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到相關結果</h3>
          <p className="text-gray-500 mb-6">請嘗試使用不同的關鍵字或調整篩選條件</p>
          <div className="text-sm text-gray-600">
            搜尋建議：
            <ul className="mt-2 space-y-1">
              <li>檢查拼字是否正確</li>
              <li>嘗試更短或更通用的關鍵字</li>
              <li>移除一些篩選條件</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
