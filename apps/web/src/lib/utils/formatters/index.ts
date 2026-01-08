/**
 * 統一的格式化工具函數
 *
 * 提供可重用的資料格式化邏輯，避免程式碼重複
 *
 * @module formatters
 */

// 日期相關
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
} from './date'

// 數字與價格相關
export {
  formatPrice,
  formatPriceRange,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatStockStatus,
  formatOrderNumber,
} from './number'

// 字串相關
export {
  formatPhone,
  formatStatus,
  formatPriority,
  formatAddress,
  formatCreditCard,
  truncateText,
  formatEmailMasked,
} from './string'
