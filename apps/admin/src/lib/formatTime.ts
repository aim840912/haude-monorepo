/**
 * 格式化時間為相對時間（取代 date-fns）
 * 例如：「3 分鐘前」、「2 小時前」、「昨天」
 */

const TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number; max: number }> = [
  { unit: 'second', ms: 1000, max: 60 },
  { unit: 'minute', ms: 60 * 1000, max: 60 },
  { unit: 'hour', ms: 60 * 60 * 1000, max: 24 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000, max: 30 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000, max: 12 },
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000, max: Infinity },
]

/**
 * 將日期格式化為相對時間字串
 * @param date - 要格式化的日期
 * @param locale - 語言設定，預設繁體中文
 * @returns 相對時間字串，例如「3 分鐘前」
 */
export function formatDistanceToNow(date: Date | string, locale = 'zh-TW'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - targetDate.getTime()

  // 處理未來時間
  if (diffMs < 0) {
    return '剛剛'
  }

  // 小於 5 秒顯示「剛剛」
  if (diffMs < 5000) {
    return '剛剛'
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  for (const { unit, ms, max } of TIME_UNITS) {
    const value = Math.floor(diffMs / ms)
    if (value < max) {
      return rtf.format(-value, unit)
    }
  }

  // Fallback：超過一年顯示實際日期
  return targetDate.toLocaleDateString(locale)
}

/**
 * 格式化日期為短日期格式
 * @param date - 要格式化的日期
 * @param locale - 語言設定
 * @returns 短日期字串，例如「2026/1/15」
 */
export function formatShortDate(date: Date | string, locale = 'zh-TW'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  return targetDate.toLocaleDateString(locale)
}

/**
 * 格式化日期時間
 * @param date - 要格式化的日期
 * @param locale - 語言設定
 * @returns 日期時間字串，例如「2026/1/15 下午 4:30」
 */
export function formatDateTime(date: Date | string, locale = 'zh-TW'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  return targetDate.toLocaleString(locale)
}
