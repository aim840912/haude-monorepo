/**
 * 統一的格式化工具函數
 *
 * 提供可重用的資料格式化邏輯，避免程式碼重複
 *
 * @deprecated 建議直接從 '@/lib/utils/formatters' 目錄導入
 * @example
 * ```ts
 * // 舊的導入方式（仍然有效）
 * import { formatDate, formatPrice } from '@/lib/utils/formatters'
 *
 * // 新的導入方式（推薦）
 * import { formatDate } from '@/lib/utils/formatters/date'
 * import { formatPrice } from '@/lib/utils/formatters/number'
 * ```
 */

// 重新導出所有格式化函數，保持向後相容
export * from './formatters/index'
