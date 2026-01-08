/**
 * 日期格式化工具函數
 */

/**
 * 格式化台灣日期
 *
 * @example
 * ```ts
 * formatDate(new Date('2025-01-15'), 'full')
 * // "2025年1月15日 星期三"
 *
 * formatDate('2025-01-15', 'short')
 * // "2025/01/15"
 *
 * formatDate('2025-01-15', 'medium')
 * // "2025年1月15日"
 * ```
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'short' | 'medium' | 'time' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // 檢查日期有效性
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
 * 格式化日期時間
 *
 * @example
 * ```ts
 * formatDateTime(new Date())
 * // "2025年1月15日 14:30"
 * ```
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化相對時間（多久之前）
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5))
 * // "5 分鐘前"
 *
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 24))
 * // "1 天前"
 * ```
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return '剛剛'
  } else if (minutes < 60) {
    return `${minutes} 分鐘前`
  } else if (hours < 24) {
    return `${hours} 小時前`
  } else if (days < 7) {
    return `${days} 天前`
  } else if (weeks < 4) {
    return `${weeks} 週前`
  } else if (months < 12) {
    return `${months} 個月前`
  } else {
    return `${years} 年前`
  }
}

/**
 * 格式化持續時間（分鐘）
 *
 * @example
 * ```ts
 * formatDuration(90) // "1 小時 30 分鐘"
 * formatDuration(45) // "45 分鐘"
 * formatDuration(120) // "2 小時"
 * ```
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} 分鐘`
  }

  if (mins === 0) {
    return `${hours} 小時`
  }

  return `${hours} 小時 ${mins} 分鐘`
}
