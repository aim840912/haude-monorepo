import { useState, useEffect, useCallback } from 'react'
import { searchApiReal } from '@/services/api'
import type { SearchResult, SearchResponse, SearchFilters } from '@/types/search'

// 環境變數控制是否使用 Mock API
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// 動態導入 mock API（僅在需要時載入）
const getMockApi = async () => {
  if (USE_MOCK) {
    const { searchApi } = await import('@/services/mock/search.mock')
    return searchApi
  }
  return null
}

/**
 * 搜尋 Hook
 */
export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [results, setResults] = useState<SearchResult[]>([])
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string, searchFilters?: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([])
      setResponse(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const currentFilters = searchFilters || filters

      if (USE_MOCK) {
        // 使用 Mock API
        const mockApi = await getMockApi()
        if (mockApi) {
          const data = await mockApi.search({
            q: searchQuery,
            filters: currentFilters,
          })
          setResults(data.results)
          setResponse(data)
        }
      } else {
        // 使用真實 API
        // 過濾掉 API 不支援的類型（目前只支援 product, farmTour, location）
        const supportedTypes = currentFilters?.type?.filter(
          (t): t is 'product' | 'farmTour' | 'location' =>
            t === 'product' || t === 'farmTour' || t === 'location'
        )
        const { data } = await searchApiReal.search({
          q: searchQuery,
          type: supportedTypes?.length ? supportedTypes : undefined,
          category: currentFilters?.category,
          minPrice: currentFilters?.priceRange?.[0],
          maxPrice: currentFilters?.priceRange?.[1],
          minRating: currentFilters?.minRating,
        })
        setResults(data.results)
        setResponse(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜尋時發生錯誤')
      setResults([])
      setResponse(null)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // 當 query 或 filters 變化時自動搜尋
  useEffect(() => {
    if (query) {
      search(query, filters)
    }
  }, [query, filters, search])

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setResponse(null)
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    results,
    response,
    isLoading,
    error,
    search,
    clearSearch,
  }
}

/**
 * 搜尋建議 Hook
 */
export function useSearchSuggestions() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        if (USE_MOCK) {
          const mockApi = await getMockApi()
          if (mockApi) {
            const data = await mockApi.getSuggestions(query)
            setSuggestions(data)
          }
        } else {
          const { data } = await searchApiReal.getSuggestions(query)
          setSuggestions(data)
        }
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    // 防抖處理
    const timeoutId = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(timeoutId)
  }, [query])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSuggestions,
  }
}

/**
 * 熱門搜尋 Hook
 */
export function useTrendingSearches() {
  const [trending, setTrending] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true)
      try {
        if (USE_MOCK) {
          // Mock 資料
          setTrending(['茶葉', '禮盒', '體驗活動', '農場導覽', '蜂蜜'])
        } else {
          const { data } = await searchApiReal.getTrending()
          setTrending(data)
        }
      } catch {
        setTrending([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrending()
  }, [])

  return {
    trending,
    isLoading,
  }
}
