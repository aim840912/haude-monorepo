/**
 * Order Mock 工廠
 *
 * 提供型別安全的 Order 相關 mock 建立函數
 */

import type {
  Order,
  OrderItem,
  ShippingAddress,
  PaymentMethod,
  OrderStatus,
  DiscountValidation,
} from '@haude/types'

/**
 * 建立 ShippingAddress mock
 */
export function createMockShippingAddress(
  overrides: Partial<ShippingAddress> = {}
): ShippingAddress {
  return {
    name: '張三',
    phone: '0912345678',
    street: '忠孝東路一段100號',
    city: '台北市',
    postalCode: '100',
    country: '台灣',
    ...overrides,
  }
}

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
    status: 'pending' as OrderStatus,
    subtotal: 1500,
    shippingFee: 0,
    tax: 0,
    discountAmount: 0,
    totalAmount: 1500,
    items: [createMockOrderItem()],
    shippingAddress: createMockShippingAddress(),
    paymentMethod: 'CREDIT' as PaymentMethod,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

/**
 * 建立多個 Order mock
 */
export function createMockOrders(count: number = 3): Order[] {
  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped']
  return Array.from({ length: count }, (_, i) =>
    createMockOrder({
      id: `order-${i + 1}`,
      orderNumber: `ORD-20240115-00${i + 1}`,
      status: statuses[i % statuses.length],
      totalAmount: 1000 * (i + 1),
    })
  )
}

/**
 * 建立有效的 DiscountValidation mock
 */
export function createMockValidDiscount(
  overrides: Partial<DiscountValidation> = {}
): DiscountValidation {
  return {
    valid: true,
    code: 'SAVE10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    discountAmount: 100,
    message: '折扣碼有效',
    ...overrides,
  }
}

/**
 * 建立無效的 DiscountValidation mock
 */
export function createMockInvalidDiscount(
  message: string = '折扣碼無效'
): DiscountValidation {
  return {
    valid: false,
    code: 'INVALID',
    message,
  }
}
