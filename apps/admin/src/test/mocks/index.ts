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
  createMockCategories,
} from './product.mock'

// Order mocks
export {
  createMockOrder,
  createMockOrders,
  createMockOrderItem,
} from './order.mock'

// Dashboard mocks
export {
  createMockDashboardStats,
  createMockSalesTrend,
  createMockTopProducts,
} from './dashboard.mock'

// Re-export types
export type {
  DashboardStats,
  SalesTrendPoint,
  TopProduct,
} from './dashboard.mock'
