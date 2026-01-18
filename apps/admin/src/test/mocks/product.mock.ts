/**
 * Product Mock 工廠
 *
 * 提供型別安全的 Product 相關 mock 建立函數
 * 使用 @haude/types 共用型別
 */

import type { Product } from '@haude/types'

/**
 * 建立 Product mock
 */
export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: '阿里山高山茶',
    description: '來自阿里山的優質茶葉',
    category: '茶葉',
    price: 500,
    stock: 100,
    isActive: true,
    images: [], // 統一使用 images（與 API 回應一致）
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

/**
 * 建立多個 Product mock
 */
export function createMockProducts(count: number = 3): Product[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: `prod-${i + 1}`,
      name: `產品 ${i + 1}`,
      price: 100 * (i + 1),
    })
  )
}

/**
 * 建立產品類別列表 mock
 */
export function createMockCategories(): string[] {
  return ['茶葉', '茶具', '禮盒', '農產品']
}
