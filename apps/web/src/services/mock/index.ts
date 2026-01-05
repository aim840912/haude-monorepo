/**
 * Mock 服務層
 *
 * 當後端 API 尚未完成時，使用 Mock 資料進行開發
 * 設定 USE_MOCK = false 可切換到真實 API
 */

export const USE_MOCK = false

export * from './farm-tour.mock'
export * from './location.mock'
export * from './schedule.mock'
export * from './search.mock'
export * from './product.mock'
export * from './order.mock'
