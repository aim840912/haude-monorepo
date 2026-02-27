/**
 * Product Mock 工廠
 *
 * 提供型別安全的 Product 相關 mock 建立函數
 */

import type { Product, ProductImage } from '@haude/types'

/**
 * 建立 ProductImage mock
 */
export function createMockProductImage(
  overrides: Partial<ProductImage> = {}
): ProductImage {
  return {
    id: 'img-1',
    storageUrl: 'https://example.com/image.jpg',
    altText: '產品圖片',
    displayPosition: 0,
    ...overrides,
  }
}

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
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    images: [createMockProductImage()],
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
