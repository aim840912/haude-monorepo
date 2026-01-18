/**
 * 搜尋 Hooks 單元測試
 *
 * 測試功能：
 * - useSearch：全站搜尋
 * - useSearchSuggestions：搜尋建議
 * - useTrendingSearches：熱門搜尋
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createMockAxiosResponse } from '@/test/mocks'

// Mock API
vi.mock('@/services/api', () => ({
  searchApiReal: {
    search: vi.fn(),
    getSuggestions: vi.fn(),
    getTrending: vi.fn(),
  },
}))

import { useSearch, useSearchSuggestions, useTrendingSearches } from './useSearch'
import { searchApiReal } from '@/services/api'

// Mock search result
const createMockSearchResult = (overrides = {}) => ({
  id: 'result-1',
  title: '阿里山高山茶',
  description: '來自阿里山的優質茶葉',
  type: 'product' as const,
  url: '/products/result-1',
  price: 500,
  relevanceScore: 0.95,
  ...overrides,
})

describe('搜尋 Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 確保環境變數設為使用真實 API
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK', 'false')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  // ========================================
  // useSearch Hook
  // ========================================

  describe('useSearch', () => {
    it('應該初始化為空狀態', () => {
      const { result } = renderHook(() => useSearch())

      expect(result.current.query).toBe('')
      expect(result.current.results).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('應該支援初始查詢', async () => {
      const mockResults = [createMockSearchResult()]
      vi.mocked(searchApiReal.search).mockResolvedValue(
        createMockAxiosResponse({
          results: mockResults,
          total: 1,
          query: '茶葉',
          processingTime: 50,
        })
      )

      const { result } = renderHook(() => useSearch('茶葉'))

      // 等待自動搜尋完成（useEffect 觸發）
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(searchApiReal.search).toHaveBeenCalled()
    })

    it('應該執行搜尋', async () => {
      const mockResults = [createMockSearchResult()]
      vi.mocked(searchApiReal.search).mockResolvedValue(
        createMockAxiosResponse({
          results: mockResults,
          total: 1,
          query: '阿里山',
          processingTime: 50,
        })
      )

      const { result } = renderHook(() => useSearch())

      await act(async () => {
        await result.current.search('阿里山')
      })

      expect(searchApiReal.search).toHaveBeenCalledWith(
        expect.objectContaining({ q: '阿里山' })
      )
      expect(result.current.results).toEqual(mockResults)
    })

    it('空查詢應該清除結果', async () => {
      const { result } = renderHook(() => useSearch())

      // 先設置一些結果
      vi.mocked(searchApiReal.search).mockResolvedValue(
        createMockAxiosResponse({ results: [createMockSearchResult()], total: 1, query: '茶', processingTime: 10 })
      )

      await act(async () => {
        await result.current.search('茶')
      })

      // 搜尋空字串
      await act(async () => {
        await result.current.search('')
      })

      expect(result.current.results).toEqual([])
    })

    it('應該支援篩選器', async () => {
      vi.mocked(searchApiReal.search).mockResolvedValue(
        createMockAxiosResponse({ results: [], total: 0, query: '茶', processingTime: 10 })
      )

      const { result } = renderHook(() => useSearch())

      await act(async () => {
        result.current.updateFilters({
          type: ['product'],
          priceRange: [100, 500],
        })
      })

      await act(async () => {
        await result.current.search('茶')
      })

      expect(searchApiReal.search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: '茶',
          type: ['product'],
          minPrice: 100,
          maxPrice: 500,
        })
      )
    })

    it('搜尋失敗應該設定錯誤', async () => {
      vi.mocked(searchApiReal.search).mockRejectedValue(new Error('搜尋服務暫時無法使用'))

      const { result } = renderHook(() => useSearch())

      await act(async () => {
        await result.current.search('茶')
      })

      expect(result.current.error).toBe('搜尋服務暫時無法使用')
      expect(result.current.results).toEqual([])
    })

    it('應該清除搜尋', async () => {
      vi.mocked(searchApiReal.search).mockResolvedValue(
        createMockAxiosResponse({ results: [createMockSearchResult()], total: 1, query: '茶', processingTime: 10 })
      )

      const { result } = renderHook(() => useSearch())

      await act(async () => {
        await result.current.search('茶')
      })

      act(() => {
        result.current.clearSearch()
      })

      expect(result.current.query).toBe('')
      expect(result.current.results).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('setQuery 應該更新查詢字串', () => {
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.setQuery('新查詢')
      })

      expect(result.current.query).toBe('新查詢')
    })
  })

  // ========================================
  // useSearchSuggestions Hook
  // ========================================

  describe('useSearchSuggestions', () => {
    it('應該初始化為空狀態', () => {
      const { result } = renderHook(() => useSearchSuggestions())

      expect(result.current.query).toBe('')
      expect(result.current.suggestions).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('應該載入搜尋建議', async () => {
      vi.mocked(searchApiReal.getSuggestions).mockResolvedValue(
        createMockAxiosResponse(['茶葉', '茶具', '茶禮盒'])
      )

      const { result } = renderHook(() => useSearchSuggestions())

      act(() => {
        result.current.setQuery('茶')
      })

      // 使用真實計時器，等待防抖 (150ms) + API 完成
      await waitFor(
        () => {
          expect(result.current.suggestions).toEqual(['茶葉', '茶具', '茶禮盒'])
        },
        { timeout: 1000 }
      )
    })

    it('空查詢應該清除建議', async () => {
      const { result } = renderHook(() => useSearchSuggestions())

      act(() => {
        result.current.setQuery('')
      })

      // 等待一點時間確保穩定
      await waitFor(() => {
        expect(result.current.suggestions).toEqual([])
      })

      expect(searchApiReal.getSuggestions).not.toHaveBeenCalled()
    })

    it('應該清除建議', async () => {
      vi.mocked(searchApiReal.getSuggestions).mockResolvedValue(
        createMockAxiosResponse(['茶葉'])
      )

      const { result } = renderHook(() => useSearchSuggestions())

      act(() => {
        result.current.setQuery('茶')
      })

      await waitFor(
        () => {
          expect(result.current.suggestions.length).toBeGreaterThan(0)
        },
        { timeout: 1000 }
      )

      act(() => {
        result.current.clearSuggestions()
      })

      expect(result.current.suggestions).toEqual([])
    })

    it('API 失敗應該返回空陣列', async () => {
      vi.mocked(searchApiReal.getSuggestions).mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() => useSearchSuggestions())

      act(() => {
        result.current.setQuery('茶')
      })

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 1000 }
      )

      // API 失敗後會保持空陣列
      expect(result.current.suggestions).toEqual([])
    })
  })

  // ========================================
  // useTrendingSearches Hook
  // ========================================

  describe('useTrendingSearches', () => {
    it('應該載入熱門搜尋', async () => {
      vi.mocked(searchApiReal.getTrending).mockResolvedValue(
        createMockAxiosResponse(['高山茶', '烏龍茶', '禮盒'])
      )

      const { result } = renderHook(() => useTrendingSearches())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.trending).toEqual(['高山茶', '烏龍茶', '禮盒'])
    })

    it('API 失敗應該返回空陣列', async () => {
      vi.mocked(searchApiReal.getTrending).mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() => useTrendingSearches())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.trending).toEqual([])
    })
  })
})
