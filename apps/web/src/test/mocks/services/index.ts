/**
 * Mock 服務層匯出
 *
 * 這些 mock 服務用於：
 * 1. 開發環境下後端 API 不可用時的 fallback
 * 2. 單元測試和整合測試
 *
 * 注意：生產程式碼使用動態導入以確保 mock 不會被打包
 */

export * from './farm-tour.mock'
export * from './location.mock'
export * from './schedule.mock'
export * from './search.mock'
export * from './product.mock'
export * from './order.mock'
export * from './mockAuthService'
