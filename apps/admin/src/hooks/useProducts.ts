import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../services/api'
import type { Product } from '@haude/types'
import logger from '../lib/logger'

export interface UpdateProductData {
  name?: string
  description?: string
  price?: number
  category?: string
  stock?: number
  isActive?: boolean
}

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProduct: (id: string, data: UpdateProductData) => Promise<boolean>
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>
  isUpdating: boolean
  isDeleting: boolean
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 使用管理員 endpoint 取得完整產品資料
      const { data } = await productsApi.getAllAdmin()
      setProducts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入產品失敗'
      setError(message)
      logger.error('[useProducts] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProduct = useCallback(async (id: string, data: UpdateProductData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await productsApi.update(id, data)
      await fetchProducts() // 重新取得列表
      return true
    } catch (err) {
      logger.error('[useProducts] 更新失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchProducts])

  const deleteProduct = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsDeleting(true)
    try {
      await productsApi.delete(id)
      await fetchProducts() // 重新取得列表
      return { success: true }
    } catch (err) {
      logger.error('[useProducts] 刪除失敗', { error: err })
      // 提取後端回傳的錯誤訊息
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any)?.response?.data?.message || '刪除失敗'
      return { success: false, error: errorMessage }
    } finally {
      setIsDeleting(false)
    }
  }, [fetchProducts])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    updateProduct,
    deleteProduct,
    isUpdating,
    isDeleting,
  }
}

interface UseProductReturn {
  product: Product | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProduct(productId: string | undefined): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(!!productId)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await productsApi.getById(productId)
      setProduct(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入產品失敗'
      setError(message)
      logger.error('[useProduct] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId, fetchProduct])

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  }
}
