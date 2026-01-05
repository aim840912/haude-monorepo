/**
 * 格式化工具函數
 */

/**
 * 格式化日期
 * @param date - 日期字串或 Date 物件
 * @param format - 格式類型
 * @returns 格式化後的日期字串
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'short' | 'medium' | 'time' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  switch (format) {
    case 'short':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    case 'medium':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'full':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    case 'time':
      return d.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      })
    default:
      return d.toLocaleDateString('zh-TW')
  }
}

/**
 * 格式化價格
 * @param price - 價格數值
 * @param currency - 貨幣符號
 * @returns 格式化後的價格字串
 */
export function formatPrice(price: number, currency: string = 'NT$'): string {
  return `${currency}${price.toLocaleString('zh-TW')}`
}
