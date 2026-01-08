/**
 * 數字與價格格式化工具函數
 */

/**
 * 格式化台幣價格
 *
 * @example
 * ```ts
 * formatPrice(1234567) // "NT$ 1,234,567"
 * formatPrice(1234.56) // "NT$ 1,235"
 * formatPrice(0) // "免費"
 * ```
 */
export function formatPrice(price: number, options?: { showFree?: boolean }): string {
  const { showFree = true } = options || {}

  if (price === 0 && showFree) {
    return '免費'
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * 格式化價格區間
 *
 * @example
 * ```ts
 * formatPriceRange(1000, 5000) // "NT$ 1,000 - NT$ 5,000"
 * formatPriceRange(1000, 1000) // "NT$ 1,000"
 * ```
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, { showFree: false })
  }

  return `${formatPrice(minPrice, { showFree: false })} - ${formatPrice(maxPrice, { showFree: false })}`
}

/**
 * 格式化檔案大小
 *
 * @example
 * ```ts
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 * formatFileSize(1073741824) // "1 GB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化數字為千分位
 *
 * @example
 * ```ts
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.56, 2) // "1,234.56"
 * ```
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * 格式化百分比
 *
 * @example
 * ```ts
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(0.5, 0) // "50%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化庫存狀態
 *
 * @example
 * ```ts
 * formatStockStatus(100) // "充足"
 * formatStockStatus(5) // "偏低"
 * formatStockStatus(0) // "缺貨"
 * ```
 */
export function formatStockStatus(stock: number): string {
  if (stock === 0) return '缺貨'
  if (stock < 10) return '偏低'
  if (stock < 50) return '適中'
  return '充足'
}

/**
 * 格式化訂單編號
 *
 * @example
 * ```ts
 * formatOrderNumber(123, new Date('2025-01-15'))
 * // "20250115-000123"
 * ```
 */
export function formatOrderNumber(orderId: number, orderDate: Date): string {
  const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '')
  const paddedId = orderId.toString().padStart(6, '0')
  return `${dateStr}-${paddedId}`
}
