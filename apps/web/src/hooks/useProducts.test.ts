/**
 * 產品 Hooks 單元測試
 *
 * 測試功能：
 * - useProducts：產品列表
 * - useProduct：單一產品
 * - useCategories：產品類別
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock API
vi.mock('@/services/api', () => ({
  productsApi: {
    getAll: vi.fn(),
    getAllAdmin: vi.fn(),
    getById: vi.fn(),
    getCategories: vi.fn(),
  },
}))

// Mock mock data
vi.mock('@/services/mock/product.mock', () => ({
  mockProducts: [
    { id: 'mock-1', name: 'Mock Product 1', price: 100 },
    { id: 'mock-2', name: 'Mock Product 2', price: 200 },
  ],
  mockCategories: ['茶葉', '茶具'],
  getMockProductById: vi.fn((id: string) => {
    if (id === 'mock-1') {
      return { id: 'mock-1', name: 'Mock Product 1', price: 100 }
    }
    return null
  }),
}))

import { useProducts, useProduct, useCategories } from './useProducts'
import { productsApi } from '@/services/api'
import { mockProducts, mockCategories, getMockProductById } from '@/services/mock/product.mock'
import { createMockProduct, createMockAxiosResponse } from '@/test/mocks'

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // useProducts Hook
  // ========================================

  describe('useProducts', () => {
    it('應該自動載入產品列表', async () => {
      const mockProductList = [
        createMockProduct({ id: 'prod-1' }),
        createMockProduct({ id: 'prod-2', name: '烏龍茶' }),
      ]
      vi.mocked(productsApi.getAll).mockResolvedValue(createMockAxiosResponse(mockProductList))

      const { result } = renderHook(() => useProducts())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.products).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('應該支援關閉自動載入', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.products).toHaveLength(0)
      expect(productsApi.getAll).not.toHaveBeenCalled()
    })

    it('應該支援手動重新載入', async () => {
      const mockProductList = [createMockProduct()]
      vi.mocked(productsApi.getAll).mockResolvedValue(createMockAxiosResponse(mockProductList))

      const { result } = renderHook(() => useProducts({ autoLoad: false }))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.products).toHaveLength(1)
    })

    it('API 失敗時應該在開發模式使用 Mock 資料', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(productsApi.getAll).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.products).toEqual(mockProducts)
      expect(result.current.error).toBeNull()

      vi.unstubAllEnvs()
    })

    it('API 失敗時應該在生產模式設定錯誤', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      vi.mocked(productsApi.getAll).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')

      vi.unstubAllEnvs()
    })

    it('應該使用 getAllAdmin 當 activeOnly 為 false', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(createMockAxiosResponse([]))

      renderHook(() => useProducts({ activeOnly: false }))

      await waitFor(() => {
        expect(productsApi.getAllAdmin).toHaveBeenCalled()
      })
    })
  })

  // ========================================
  // useProduct Hook
  // ========================================

  describe('useProduct', () => {
    it('應該載入單一產品', async () => {
      const mockProduct = createMockProduct()
      vi.mocked(productsApi.getById).mockResolvedValue(createMockAxiosResponse(mockProduct))

      const { result } = renderHook(() => useProduct('prod-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.product).toEqual(mockProduct)
      expect(result.current.error).toBeNull()
    })

    it('應該處理 undefined productId', () => {
      const { result } = renderHook(() => useProduct(undefined))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.product).toBeNull()
      expect(productsApi.getById).not.toHaveBeenCalled()
    })

    it('應該支援手動重新載入', async () => {
      const mockProduct = createMockProduct()
      vi.mocked(productsApi.getById).mockResolvedValue(createMockAxiosResponse(mockProduct))

      const { result } = renderHook(() => useProduct('prod-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Reset and refetch
      vi.mocked(productsApi.getById).mockClear()
      vi.mocked(productsApi.getById).mockResolvedValue(createMockAxiosResponse(mockProduct))

      await act(async () => {
        await result.current.refetch()
      })

      expect(productsApi.getById).toHaveBeenCalledTimes(1)
    })

    it('API 失敗時應該在開發模式使用 Mock 資料', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(productsApi.getById).mockRejectedValue(new Error('Not found'))
      vi.mocked(getMockProductById).mockReturnValue(createMockProduct({ id: 'mock-1' }) as ReturnType<typeof getMockProductById>)

      const { result } = renderHook(() => useProduct('mock-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.product).toBeDefined()
      expect(result.current.error).toBeNull()

      vi.unstubAllEnvs()
    })

    it('Mock 也找不到時應該設定錯誤', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(productsApi.getById).mockRejectedValue(new Error('Not found'))
      vi.mocked(getMockProductById).mockReturnValue(null as unknown as ReturnType<typeof getMockProductById>)

      const { result } = renderHook(() => useProduct('non-existent'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('找不到該產品')

      vi.unstubAllEnvs()
    })
  })

  // ========================================
  // useCategories Hook
  // ========================================

  describe('useCategories', () => {
    it('應該載入產品類別', async () => {
      vi.mocked(productsApi.getCategories).mockResolvedValue(createMockAxiosResponse(['茶葉', '茶具', '禮盒']))

      const { result } = renderHook(() => useCategories())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.categories).toEqual(['茶葉', '茶具', '禮盒'])
      expect(result.current.error).toBeNull()
    })

    it('API 失敗時應該在開發模式使用 Mock 類別', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(productsApi.getCategories).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCategories())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.categories).toEqual(mockCategories)
      expect(result.current.error).toBeNull()

      vi.unstubAllEnvs()
    })
  })
})
