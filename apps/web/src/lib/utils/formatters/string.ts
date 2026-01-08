/**
 * 字串格式化工具函數
 */

/**
 * 格式化電話號碼
 *
 * @example
 * ```ts
 * formatPhone('0912345678') // "0912-345-678"
 * formatPhone('0223456789') // "(02)2345-6789"
 * formatPhone('0312345678') // "(03)123-4567"
 * ```
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // 手機號碼: 0912-345-678
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // 台北市話: (02)2345-6789
  if (cleaned.length === 9 && cleaned.startsWith('02')) {
    return `(02)${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // 其他市話: (03)123-4567 或 (04)1234-5678
  if (cleaned.length === 9 && /^0[3-9]/.test(cleaned)) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }

  if (cleaned.length === 10 && /^0[3-9]/.test(cleaned)) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // 無法格式化，返回原始清理後的號碼
  return cleaned
}

/**
 * 格式化狀態文字
 *
 * @example
 * ```ts
 * formatStatus('pending') // "待處理"
 * formatStatus('completed') // "已完成"
 * ```
 */
export function formatStatus(status: string, type: 'order' | 'inquiry' | 'note' = 'order'): string {
  const statusMaps = {
    order: {
      pending: '待處理',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    },
    inquiry: {
      pending: '待回覆',
      replied: '已回覆',
      resolved: '已解決',
      closed: '已關閉',
    },
    note: {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      blocked: '阻塞中',
    },
  }

  const map = statusMaps[type]
  return map[status as keyof typeof map] || status
}

/**
 * 格式化優先級
 *
 * @example
 * ```ts
 * formatPriority('high') // "高"
 * formatPriority('low') // "低"
 * ```
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急',
  }
  return priorityMap[priority] || priority
}

/**
 * 格式化地址
 *
 * @example
 * ```ts
 * formatAddress({
 *   zipCode: '100',
 *   city: '台北市',
 *   district: '中正區',
 *   street: '重慶南路一段122號'
 * })
 * // "100 台北市中正區重慶南路一段122號"
 * ```
 */
export function formatAddress(address: {
  zipCode?: string
  city: string
  district: string
  street: string
}): string {
  const parts: string[] = []

  if (address.zipCode) {
    parts.push(address.zipCode)
  }

  parts.push(address.city)
  parts.push(address.district)
  parts.push(address.street)

  return parts.join(' ')
}

/**
 * 格式化信用卡號碼（遮蔽中間數字）
 *
 * @example
 * ```ts
 * formatCreditCard('1234567890123456') // "1234 **** **** 3456"
 * ```
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')

  if (cleaned.length !== 16) {
    return cardNumber
  }

  return `${cleaned.slice(0, 4)} **** **** ${cleaned.slice(12)}`
}

/**
 * 截斷文字並加上省略號
 *
 * @example
 * ```ts
 * truncateText('這是一段很長的文字', 10) // "這是一段很長的..."
 * truncateText('短文字', 10) // "短文字"
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}

/**
 * 格式化 Email（遮蔽部分字元）
 *
 * @example
 * ```ts
 * formatEmailMasked('user@example.com') // "u***@example.com"
 * ```
 */
export function formatEmailMasked(email: string): string {
  const [localPart, domain] = email.split('@')

  if (!domain) {
    return email
  }

  if (localPart.length <= 3) {
    return `${localPart.charAt(0)}***@${domain}`
  }

  return `${localPart.charAt(0)}***${localPart.charAt(localPart.length - 1)}@${domain}`
}
