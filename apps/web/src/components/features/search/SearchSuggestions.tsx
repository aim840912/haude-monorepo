import { Search, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestionsProps {
  /** 搜尋建議列表 */
  suggestions: string[]
  /** 最近搜尋記錄 */
  recentSearches?: string[]
  /** 熱門搜尋 */
  trendingSearches?: string[]
  /** 選中的索引 */
  selectedIndex?: number
  /** 點擊建議回調 */
  onSuggestionClick: (suggestion: string) => void
  /** 清除記錄回調 */
  onClearRecent?: () => void
  /** 自訂類名 */
  className?: string
  /** 是否顯示 */
  isVisible?: boolean
}

/**
 * 搜尋建議元件
 * 顯示即時建議、最近搜尋和熱門搜尋
 */
export function SearchSuggestions({
  suggestions,
  recentSearches = [],
  trendingSearches = ['蜂蜜', '禮盒', '有機', '龍眼蜜'],
  selectedIndex = -1,
  onSuggestionClick,
  onClearRecent,
  className,
  isVisible = true,
}: SearchSuggestionsProps) {
  if (!isVisible) return null

  const hasContent = suggestions.length > 0 || recentSearches.length > 0 || trendingSearches.length > 0

  if (!hasContent) return null

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* 即時搜尋建議 */}
      {suggestions.length > 0 && (
        <div className="py-2">
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={`suggestion-${suggestion}`}>
                <button
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-green-50',
                    'flex items-center gap-3',
                    index === selectedIndex && 'bg-green-50'
                  )}
                >
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 最近搜尋 */}
      {suggestions.length === 0 && recentSearches.length > 0 && (
        <div className="py-2 border-b border-gray-100">
          <div className="px-4 py-1 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">最近搜尋</span>
            {onClearRecent && (
              <button
                onClick={onClearRecent}
                className="text-xs text-green-600 hover:underline"
              >
                清除
              </button>
            )}
          </div>
          <ul>
            {recentSearches.slice(0, 5).map(term => (
              <li key={`recent-${term}`}>
                <button
                  type="button"
                  onClick={() => onSuggestionClick(term)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{term}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 熱門搜尋 */}
      {suggestions.length === 0 && trendingSearches.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase">熱門搜尋</span>
          </div>
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {trendingSearches.map(term => (
              <button
                key={`trending-${term}`}
                onClick={() => onSuggestionClick(term)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5',
                  'text-sm text-gray-700 bg-gray-100 rounded-full',
                  'hover:bg-green-100 hover:text-green-700 transition-colors'
                )}
              >
                <TrendingUp className="w-3 h-3" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
