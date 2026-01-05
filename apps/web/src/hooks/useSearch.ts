import { useState, useEffect, useCallback } from 'react'
import { searchApi } from '@/services/mock/search.mock'
import type { SearchResult, SearchResponse, SearchFilters } from '@/types/search'

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
      const data = await searchApi.search({
        q: searchQuery,
        filters: searchFilters || filters,
      })
      setResults(data.results)
      setResponse(data)
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
        const data = await searchApi.getSuggestions(query)
        setSuggestions(data)
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
