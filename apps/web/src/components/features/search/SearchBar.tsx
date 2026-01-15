import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, TrendingUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchSuggestions, useTrendingSearches } from '@/hooks/useSearch'
import { useSearchHistory } from '@/hooks/useSearchHistory'

interface SearchBarProps {
  /** 初始搜尋值 */
  initialValue?: string
  /** 佔位符文字 */
  placeholder?: string
  /** 搜尋提交回調 */
  onSearch: (query: string) => void
  /** 自訂類名 */
  className?: string
  /** 是否自動聚焦 */
  autoFocus?: boolean
  /** 是否顯示歷史記錄和熱門搜尋 */
  showHistoryAndTrending?: boolean
}

/**
 * 搜尋列元件
 * 支援即時建議和鍵盤導航
 */
export function SearchBar({
  initialValue = '',
  placeholder = '搜尋產品、體驗活動...',
  onSearch,
  className,
  autoFocus = false,
  showHistoryAndTrending = true,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { setQuery, suggestions } = useSearchSuggestions()
  const { trending } = useTrendingSearches()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

  // 決定是否顯示歷史/熱門（輸入為空時）或建議（有輸入時）
  const showHistorySection = showHistoryAndTrending && inputValue.trim() === '' && (history.length > 0 || trending.length > 0)
  const showSuggestions = inputValue.trim() !== '' && suggestions.length > 0

  // 計算可導航項目總數
  const getNavigableItems = () => {
    if (showSuggestions) return suggestions
    if (showHistorySection) return [...history, ...trending]
    return []
  }
  const navigableItems = getNavigableItems()

  // 同步輸入值到建議 hook
  useEffect(() => {
    setQuery(inputValue)
  }, [inputValue, setQuery])

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      addToHistory(inputValue.trim())
      onSearch(inputValue.trim())
      setShowDropdown(false)
    }
  }

  const handleItemClick = (item: string) => {
    setInputValue(item)
    addToHistory(item)
    onSearch(item)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || navigableItems.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < navigableItems.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : navigableItems.length - 1))
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleItemClick(navigableItems[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleClear = () => {
    setInputValue('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    removeFromHistory(item)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              setShowDropdown(true)
              setSelectedIndex(-1)
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              'w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
              'transition-colors'
            )}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* 下拉選單 */}
      {showDropdown && (showSuggestions || showHistorySection) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto">
          {/* 搜尋建議（有輸入時顯示） */}
          {showSuggestions && (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(suggestion)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-green-50',
                      'flex items-center gap-2',
                      index === selectedIndex && 'bg-green-50'
                    )}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 歷史記錄和熱門搜尋（輸入為空時顯示） */}
          {showHistorySection && (
            <>
              {/* 搜尋歷史 */}
              {history.length > 0 && (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      搜尋歷史
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      清除全部
                    </button>
                  </div>
                  <ul>
                    {history.map((item, index) => (
                      <li key={`history-${item}`}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-green-50',
                            'flex items-center justify-between group',
                            index === selectedIndex && 'bg-green-50'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{item}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveHistoryItem(e, item)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          </button>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 熱門搜尋 */}
              {trending.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      熱門搜尋
                    </span>
                  </div>
                  <ul>
                    {trending.map((item, index) => (
                      <li key={`trending-${item}`}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-green-50',
                            'flex items-center gap-2',
                            history.length + index === selectedIndex && 'bg-green-50'
                          )}
                        >
                          <TrendingUp className="w-4 h-4 text-orange-400" />
                          <span>{item}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
