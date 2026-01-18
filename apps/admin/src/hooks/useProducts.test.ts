/**
 * Admin 產品 Hooks 單元測試
 *
 * 測試功能：
 * - useProducts：產品列表與 CRUD 操作
 * - useProduct：單一產品
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock API
vi.mock('../services/api', () => ({
  productsApi: {
    getAll: vi.fn(),
    getAllAdmin: vi.fn(),
    getById: vi.fn(),
    createDraft: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock logger
vi.mock('../lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

import { useProducts, useProduct } from './useProducts'
import { productsApi } from '../services/api'
import { createMockProduct, createMockAxiosResponse } from '../test/mocks'

describe('Admin 產品 Hooks', () => {
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
      const mockProducts = [
        createMockProduct({ id: 'prod-1' }),
        createMockProduct({ id: 'prod-2', name: '烏龍茶' }),
      ]
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(createMockAxiosResponse(mockProducts))

      const { result } = renderHook(() => useProducts())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.products).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('createDraft 應該建立草稿產品', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(createMockAxiosResponse([]))
      vi.mocked(productsApi.createDraft).mockResolvedValue(
        createMockAxiosResponse(createMockProduct({ id: 'draft-1', name: '新產品草稿' }))
      )

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let draftProduct = null
      await act(async () => {
        draftProduct = await result.current.createDraft()
      })

      expect(draftProduct).toBeDefined()
      expect(productsApi.createDraft).toHaveBeenCalled()
    })

    it('createProduct 應該建立新產品', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(createMockAxiosResponse([]))
      vi.mocked(productsApi.create).mockResolvedValue(
        createMockAxiosResponse(createMockProduct())
      )

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let success = false
      await act(async () => {
        success = await result.current.createProduct({
          name: '新產品',
          price: 300,
          stock: 50,
        })
      })

      expect(success).toBe(true)
      expect(productsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '新產品',
          price: 300,
          inventory: 50, // hook 將 stock 轉換為 inventory
        })
      )
    })

    it('updateProduct 應該更新產品', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(
        createMockAxiosResponse([createMockProduct()])
      )
      vi.mocked(productsApi.update).mockResolvedValue(
        createMockAxiosResponse(createMockProduct({ price: 600 }))
      )

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let success = false
      await act(async () => {
        success = await result.current.updateProduct('prod-1', { price: 600 })
      })

      expect(success).toBe(true)
      expect(productsApi.update).toHaveBeenCalledWith('prod-1', { price: 600 })
    })

    it('deleteProduct 應該刪除產品', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(
        createMockAxiosResponse([createMockProduct()])
      )
      vi.mocked(productsApi.delete).mockResolvedValue(createMockAxiosResponse({}))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let deleteResult: { success: boolean; error?: string } = { success: false }
      await act(async () => {
        deleteResult = await result.current.deleteProduct('prod-1')
      })

      expect(deleteResult.success).toBe(true)
      expect(productsApi.delete).toHaveBeenCalledWith('prod-1')
    })

    it('deleteProduct 失敗應該返回錯誤', async () => {
      vi.mocked(productsApi.getAllAdmin).mockResolvedValue(
        createMockAxiosResponse([createMockProduct()])
      )
      const mockError = { response: { data: { message: '產品有未完成訂單，無法刪除' } } }
      vi.mocked(productsApi.delete).mockRejectedValue(mockError)

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let deleteResult: { success: boolean; error?: string } = { success: false }
      await act(async () => {
        deleteResult = await result.current.deleteProduct('prod-1')
      })

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toBe('產品有未完成訂單，無法刪除')
    })

    it('API 失敗應該設定錯誤', async () => {
      vi.mocked(productsApi.getAllAdmin).mockRejectedValue(new Error('載入產品失敗'))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('載入產品失敗')
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

    it('API 失敗應該設定錯誤', async () => {
      vi.mocked(productsApi.getById).mockRejectedValue(new Error('找不到產品'))

      const { result } = renderHook(() => useProduct('non-existent'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('找不到產品')
    })

    it('應該支援手動重新載入', async () => {
      const mockProduct = createMockProduct()
      vi.mocked(productsApi.getById).mockResolvedValue(createMockAxiosResponse(mockProduct))

      const { result } = renderHook(() => useProduct('prod-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(productsApi.getById).mockClear()

      await act(async () => {
        await result.current.refetch()
      })

      expect(productsApi.getById).toHaveBeenCalledTimes(1)
    })
  })
})
