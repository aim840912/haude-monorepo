import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../services/api'
import type { Product } from '@haude/types'

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 先嘗試使用公開的 products endpoint
      const { data } = await productsApi.getAll()
      setProducts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入產品失敗'
      setError(message)
      console.error('[useProducts] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
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
      console.error('[useProduct] API 錯誤:', err)
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
