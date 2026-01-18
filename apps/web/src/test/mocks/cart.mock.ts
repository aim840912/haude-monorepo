/**
 * Cart Mock 工廠
 *
 * 提供型別安全的購物車相關 mock 建立函數
 */

import type { CartItem } from '@/stores/cartStore'

/**
 * 建立 CartItem mock
 */
export function createMockCartItem(
  overrides: Partial<CartItem> = {}
): CartItem {
  return {
    id: 'cart-item-1',
    productId: 'prod-1',
    name: '阿里山高山茶',
    price: 500,
    quantity: 2,
    maxQuantity: 100,
    image: 'https://example.com/tea.jpg',
    ...overrides,
  }
}

/**
 * 建立多個 CartItem mock
 */
export function createMockCartItems(count: number = 2): CartItem[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCartItem({
      id: `cart-item-${i + 1}`,
      productId: `prod-${i + 1}`,
      name: `產品 ${i + 1}`,
      price: 100 * (i + 1),
      quantity: i + 1,
    })
  )
}

/**
 * 建立 API 回傳的購物車格式 mock
 */
export function createMockApiCart(
  items: Array<{ productId: string; quantity: number }>
): {
  items: Array<{
    id: string
    productId: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
      stock: number
      image: string | null
    }
  }>
} {
  return {
    items: items.map((item, index) => ({
      id: `cart-item-${index}`,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.productId,
        name: `Product ${index}`,
        price: 500,
        stock: 100,
        image: null,
      },
    })),
  }
}
