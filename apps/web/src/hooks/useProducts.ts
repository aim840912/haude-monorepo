import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '@/services/api'
import type { Product } from '@haude/types'

/**
 * 動態載入 Mock 資料（僅開發環境使用）
 * 使用動態導入確保 mock 資料不會被打包進生產環境
 */
const getMockData = async () => {
  const { mockProducts, mockCategories, getMockProductById } = await import(
    '@/test/mocks/services/product.mock'
  )
  return { mockProducts, mockCategories, getMockProductById }
}

interface UseProductsOptions {
  /** 是否自動載入 */
  autoLoad?: boolean
  /** 是否只載入啟用的產品（預設 true） */
  activeOnly?: boolean
}

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 產品列表 Hook
 *
 * @example
 * ```tsx
 * const { products, isLoading, error, refetch } = useProducts()
 * ```
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { autoLoad = true, activeOnly = true } = options
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = activeOnly ? productsApi.getAll : productsApi.getAllAdmin
      const { data } = await endpoint()
      setProducts(data)
    } catch (err) {
      // 開發模式：API 失敗時使用 Mock 資料
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.warn('[useProducts] API 不可用，使用 Mock 資料')
          const { mockProducts } = await getMockData()
          setProducts(mockProducts)
          setError(null)
        } catch {
          const message = err instanceof Error ? err.message : '載入產品失敗'
          setError(message)
        }
      } else {
        const message = err instanceof Error ? err.message : '載入產品失敗'
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    if (autoLoad) {
      fetchProducts()
    }
  }, [autoLoad, fetchProducts])

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

/**
 * 單一產品 Hook
 *
 * @example
 * ```tsx
 * const { product, isLoading, error } = useProduct(productId)
 * ```
 */
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
      // 開發模式：API 失敗時使用 Mock 資料
      if (process.env.NODE_ENV !== 'production') {
        try {
          const { getMockProductById } = await getMockData()
          const mockProduct = getMockProductById(productId)
          if (mockProduct) {
            console.warn('[useProduct] API 不可用，使用 Mock 資料')
            setProduct(mockProduct)
            setError(null)
          } else {
            setError('找不到該產品')
          }
        } catch {
          const message = err instanceof Error ? err.message : '載入產品失敗'
          setError(message)
        }
      } else {
        const message = err instanceof Error ? err.message : '載入產品失敗'
        setError(message)
      }
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

interface UseCategoriesReturn {
  categories: string[]
  isLoading: boolean
  error: string | null
}

/**
 * 產品類別 Hook
 *
 * @example
 * ```tsx
 * const { categories, isLoading } = useCategories()
 * ```
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await productsApi.getCategories()
        setCategories(data)
      } catch (err) {
        // 開發模式：API 失敗時使用 Mock 類別
        if (process.env.NODE_ENV !== 'production') {
          try {
            console.warn('[useCategories] API 不可用，使用 Mock 類別')
            const { mockCategories } = await getMockData()
            setCategories(mockCategories)
            setError(null)
          } catch {
            const message = err instanceof Error ? err.message : '載入類別失敗'
            setError(message)
          }
        } else {
          const message = err instanceof Error ? err.message : '載入類別失敗'
          setError(message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    isLoading,
    error,
  }
}
