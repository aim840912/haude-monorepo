/**
 * Mock 工廠統一導出
 *
 * 使用方式：
 * import { createMockProduct, createMockAxiosResponse } from '@/test/mocks'
 */

// Axios mocks
export {
  createMockAxiosResponse,
  createMockAxiosErrorResponse,
  createMockPaginatedResponse,
} from './axios.mock'

// Product mocks
export {
  createMockProduct,
  createMockProducts,
  createMockProductImage,
  createMockCategories,
} from './product.mock'

// Order mocks
export {
  createMockOrder,
  createMockOrders,
  createMockOrderItem,
  createMockShippingAddress,
  createMockValidDiscount,
  createMockInvalidDiscount,
} from './order.mock'

// Cart mocks
export {
  createMockCartItem,
  createMockCartItems,
  createMockApiCart,
} from './cart.mock'
