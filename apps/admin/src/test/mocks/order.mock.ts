/**
 * Order Mock 工廠
 *
 * 提供型別安全的 Order 相關 mock 建立函數
 * 使用 @haude/types 共用型別
 */

import type { Order, OrderItem } from '@haude/types'

/**
 * 建立 OrderItem mock
 */
export function createMockOrderItem(
  overrides: Partial<OrderItem> = {}
): OrderItem {
  return {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    productName: '阿里山高山茶',
    unitPrice: 500,
    quantity: 2,
    subtotal: 1000,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

/**
 * 建立 Order mock
 */
export function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    orderNumber: 'ORD-20240115-001',
    userId: 'user-1',
    status: 'pending',
    subtotal: 1500,
    shippingFee: 0,
    tax: 0,
    discountAmount: 0,
    totalAmount: 1500,
    items: [createMockOrderItem()],
    shippingAddress: {
      name: '張三',
      phone: '0912345678',
      street: '忠孝東路一段100號',
      city: '台北市',
      postalCode: '100',
      country: '台灣',
    },
    paymentMethod: 'CREDIT',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

/**
 * 建立多個 Order mock
 */
export function createMockOrders(count: number = 3): Order[] {
  const statuses = ['pending', 'confirmed', 'shipped'] as const
  return Array.from({ length: count }, (_, i) =>
    createMockOrder({
      id: `order-${i + 1}`,
      orderNumber: `ORD-20240115-00${i + 1}`,
      status: statuses[i % statuses.length],
      totalAmount: 1000 * (i + 1),
    })
  )
}
