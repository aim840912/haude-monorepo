import type { Order, OrderItem, ShippingAddress } from '@haude/types'

/**
 * Mock 訂單資料
 * 用於開發模式下後端不可用時的 fallback
 *
 * 涵蓋測試情境：
 * - 不同訂單狀態 (pending, confirmed, processing, shipped, delivered, cancelled)
 * - 不同付款方式和狀態
 * - 多商品訂單
 */

const mockShippingAddress: ShippingAddress = {
  name: '王小明',
  phone: '0912345678',
  street: '中正路 100 號 5 樓',
  city: '台北市中正區',
  postalCode: '100',
  country: '台灣',
  notes: '請於上班時間送達',
}

const createOrderItem = (
  id: string,
  orderId: string,
  productId: string,
  productName: string,
  quantity: number,
  unitPrice: number,
  priceUnit?: string
): OrderItem => ({
  id,
  orderId,
  productId,
  productName,
  productImage: '/placeholder-product.jpg',
  quantity,
  unitPrice,
  priceUnit,
  subtotal: unitPrice * quantity,
  createdAt: '2024-12-01T10:00:00Z',
  updatedAt: '2024-12-01T10:00:00Z',
})

export const mockOrders: Order[] = [
  // 已完成訂單
  {
    id: 'mock-order-1',
    orderNumber: 'ORD20241201001',
    userId: 'mock-user-1',
    status: 'delivered',
    items: [
      createOrderItem('item-1', 'mock-order-1', 'mock-prod-1', '有機蜂蜜', 2, 580, '罐'),
      createOrderItem('item-2', 'mock-order-1', 'mock-prod-3', '高山烏龍茶', 1, 1200, '包'),
    ],
    subtotal: 2360,
    shippingFee: 100,
    tax: 0,
    discountAmount: 0,
    totalAmount: 2460,
    shippingAddress: mockShippingAddress,
    paymentMethod: 'CREDIT',
    paymentStatus: 'paid',
    paymentTime: '2024-12-01T10:05:00Z',
    trackingNumber: 'TW123456789',
    estimatedDeliveryDate: '2024-12-05',
    actualDeliveryDate: '2024-12-04',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-04T15:30:00Z',
  },

  // 配送中訂單
  {
    id: 'mock-order-2',
    orderNumber: 'ORD20241210001',
    userId: 'mock-user-1',
    status: 'shipped',
    items: [
      createOrderItem('item-3', 'mock-order-2', 'mock-prod-5', '有機蔬菜箱', 1, 650, '箱'),
      createOrderItem('item-4', 'mock-order-2', 'mock-prod-6', '愛文芒果', 1, 1800, '箱'),
    ],
    subtotal: 2450,
    shippingFee: 150,
    tax: 0,
    discountAmount: 0,
    totalAmount: 2600,
    shippingAddress: { ...mockShippingAddress, name: '李小華', phone: '0923456789' },
    paymentMethod: 'CREDIT',
    paymentStatus: 'paid',
    paymentTime: '2024-12-10T14:20:00Z',
    trackingNumber: 'TW987654321',
    estimatedDeliveryDate: '2024-12-15',
    createdAt: '2024-12-10T14:15:00Z',
    updatedAt: '2024-12-12T09:00:00Z',
  },

  // 處理中訂單
  {
    id: 'mock-order-3',
    orderNumber: 'ORD20241214001',
    userId: 'mock-user-1',
    status: 'processing',
    items: [
      createOrderItem('item-5', 'mock-order-3', 'mock-prod-7', '手工竹編籃', 1, 1500, '個'),
      createOrderItem('item-6', 'mock-order-3', 'mock-prod-8', '鶯歌陶瓷茶具組', 1, 2800, '組'),
    ],
    subtotal: 4300,
    shippingFee: 0, // 滿額免運
    tax: 0,
    discountAmount: 0,
    totalAmount: 4300,
    shippingAddress: mockShippingAddress,
    paymentMethod: 'VACC',
    paymentStatus: 'paid',
    paymentTime: '2024-12-14T08:30:00Z',
    paymentBankCode: '012',
    estimatedDeliveryDate: '2024-12-20',
    notes: '希望能包裝精美，作為禮物',
    createdAt: '2024-12-14T08:00:00Z',
    updatedAt: '2024-12-14T10:00:00Z',
  },

  // 待付款訂單
  {
    id: 'mock-order-4',
    orderNumber: 'ORD20241215001',
    userId: 'mock-user-1',
    status: 'pending',
    items: [createOrderItem('item-7', 'mock-order-4', 'mock-prod-2', '龍眼蜜', 3, 450, '罐')],
    subtotal: 1350,
    shippingFee: 100,
    tax: 0,
    discountAmount: 0,
    totalAmount: 1450,
    shippingAddress: mockShippingAddress,
    paymentMethod: 'CVS',
    paymentStatus: 'pending',
    paymentExpireDate: '2024-12-18T23:59:59Z',
    createdAt: '2024-12-15T09:00:00Z',
    updatedAt: '2024-12-15T09:00:00Z',
  },

  // 已取消訂單
  {
    id: 'mock-order-5',
    orderNumber: 'ORD20241130001',
    userId: 'mock-user-1',
    status: 'cancelled',
    items: [createOrderItem('item-8', 'mock-order-5', 'mock-prod-4', '日月潭紅茶', 2, 800, '包')],
    subtotal: 1600,
    shippingFee: 100,
    tax: 0,
    discountAmount: 0,
    totalAmount: 1700,
    shippingAddress: mockShippingAddress,
    paymentMethod: 'CREDIT',
    paymentStatus: 'refunded',
    notes: '客戶要求取消',
    createdAt: '2024-11-30T16:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
]

/**
 * 根據 ID 取得單一 Mock 訂單
 */
export function getMockOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id)
}

/**
 * Mock 訂單 API
 */
export const mockOrdersApi = {
  getAll: async (params?: { limit?: number; offset?: number }) => {
    // 模擬網路延遲
    await new Promise((resolve) => setTimeout(resolve, 300))

    const limit = params?.limit || 10
    const offset = params?.offset || 0
    const paginatedOrders = mockOrders.slice(offset, offset + limit)

    return {
      orders: paginatedOrders,
      total: mockOrders.length,
      hasMore: offset + limit < mockOrders.length,
      nextOffset: offset + limit < mockOrders.length ? offset + limit : undefined,
    }
  },

  getById: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return getMockOrderById(id) || null
  },
}
