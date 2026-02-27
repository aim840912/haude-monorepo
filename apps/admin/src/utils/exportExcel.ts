import type { PeriodStats, SalesDetailItem } from '../services/api'

interface ExportData {
  summary: PeriodStats
  changes?: {
    revenueChange: number
    ordersChange: number
    aovChange: number
    cancelRateChange: number
  } | null
  period: {
    start: string
    end: string
  }
  items: SalesDetailItem[]
}

/**
 * 將數據轉換為 CSV 格式
 * 使用原生 JavaScript 實作，無需額外依賴
 */
function arrayToCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number): string => {
    const str = String(value)
    // 如果包含逗號、換行或引號，需要用引號包裹
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.map(escape).join(',')
  const dataLines = rows.map((row) => row.map(escape).join(','))

  return [headerLine, ...dataLines].join('\n')
}

/**
 * 下載 CSV 檔案
 */
function downloadCsv(content: string, filename: string): void {
  // 添加 BOM 以確保 Excel 正確識別 UTF-8 編碼
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * 匯出銷售報表為 CSV
 * 包含摘要和明細兩個部分
 */
export function exportSalesReport(data: ExportData): void {
  const { summary, changes, period, items } = data

  // 準備摘要資料
  const summaryHeaders = ['指標', '數值', '變化']
  const summaryRows: (string | number)[][] = [
    ['總營收', `NT$ ${summary.totalRevenue.toLocaleString()}`, changes ? `${changes.revenueChange > 0 ? '+' : ''}${changes.revenueChange.toFixed(1)}%` : '-'],
    ['訂單數', summary.totalOrders, changes ? `${changes.ordersChange > 0 ? '+' : ''}${changes.ordersChange.toFixed(1)}%` : '-'],
    ['平均客單價', `NT$ ${summary.averageOrderValue.toLocaleString()}`, changes ? `${changes.aovChange > 0 ? '+' : ''}${changes.aovChange.toFixed(1)}%` : '-'],
    ['取消率', `${summary.cancelRate.toFixed(1)}%`, changes ? `${changes.cancelRateChange > 0 ? '+' : ''}${changes.cancelRateChange.toFixed(1)}%` : '-'],
  ]

  // 準備明細資料
  const detailHeaders = [
    '日期',
    '訂單編號',
    '客戶姓名',
    '商品數',
    '小計',
    '折扣',
    '運費',
    '總計',
    '訂單狀態',
    '付款狀態',
  ]

  const statusLabels: Record<string, string> = {
    pending: '待處理',
    confirmed: '已確認',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
    paid: '已付款',
    failed: '付款失敗',
  }

  const detailRows: (string | number)[][] = items.map((item) => [
    item.date,
    item.orderNumber,
    item.customerName,
    item.productCount,
    item.subtotal,
    item.discount,
    item.shipping,
    item.total,
    statusLabels[item.status] || item.status,
    statusLabels[item.paymentStatus] || item.paymentStatus,
  ])

  // 組合完整的 CSV 內容
  const reportTitle = `銷售報表 (${period.start} ~ ${period.end})`
  const summaryCsv = arrayToCsv(summaryHeaders, summaryRows)
  const detailCsv = arrayToCsv(detailHeaders, detailRows)

  const fullContent = [
    reportTitle,
    '',
    '【銷售摘要】',
    summaryCsv,
    '',
    '【銷售明細】',
    detailCsv,
  ].join('\n')

  // 生成檔名
  const filename = `銷售報表_${period.start}_${period.end}.csv`

  downloadCsv(fullContent, filename)
}

// ==================== Order Export ====================

/**
 * Exportable order shape — matches API response from getAllOrders.
 * Uses optional fields to safely handle varying API payloads.
 */
interface ExportableOrder {
  orderNumber: string
  createdAt: string
  userName?: string
  userEmail?: string
  items: {
    productName: string
    quantity: number
    subtotal: number
  }[]
  subtotalAmount?: number
  shippingFee?: number
  discountAmount?: number
  totalAmount: number
  status: string
  paymentStatus?: string
  shippingAddress?: Record<string, string> | string | null
  notes?: string
  note?: string
}

/**
 * 匯出訂單資料為 CSV
 * 一訂單一行，商品明細合併為一欄（方便會計對帳）
 */
export function exportOrdersCsv(
  orders: ExportableOrder[],
  dateRange?: { start: string; end: string },
): void {
  const headers = [
    '訂單編號',
    '建立日期',
    '客戶名稱',
    '客戶 Email',
    '商品明細',
    '商品數量',
    '小計',
    '運費',
    '折扣',
    '總金額',
    '訂單狀態',
    '付款狀態',
    '收件人',
    '配送地址',
    '備註',
  ]

  const orderStatusLabels: Record<string, string> = {
    pending: '待處理',
    confirmed: '已確認',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消',
    refunded: '已退款',
  }

  const paymentLabels: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    failed: '付款失敗',
    refunded: '已退款',
    expired: '已過期',
  }

  const rows: (string | number)[][] = orders.map((order) => {
    // Combine items: "高山烏龍茶 x2, 東方美人 x1"
    const itemDetail = order.items
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(', ')

    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

    // Parse shipping address (could be JSON object or string)
    let recipientName = ''
    let addressStr = ''
    if (order.shippingAddress) {
      if (typeof order.shippingAddress === 'string') {
        try {
          const parsed = JSON.parse(order.shippingAddress)
          recipientName = parsed.name || ''
          addressStr = [parsed.postalCode, parsed.city, parsed.street]
            .filter(Boolean)
            .join(' ')
        } catch {
          addressStr = order.shippingAddress
        }
      } else if (typeof order.shippingAddress === 'object') {
        recipientName = order.shippingAddress.name || ''
        addressStr = [
          order.shippingAddress.postalCode,
          order.shippingAddress.city,
          order.shippingAddress.street,
        ]
          .filter(Boolean)
          .join(' ')
      }
    }

    const subtotal =
      order.subtotalAmount ?? order.items.reduce((sum, item) => sum + item.subtotal, 0)

    return [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString('zh-TW'),
      order.userName || '',
      order.userEmail || '',
      itemDetail,
      totalQuantity,
      subtotal,
      order.shippingFee ?? 0,
      order.discountAmount ?? 0,
      order.totalAmount,
      orderStatusLabels[order.status] || order.status,
      order.paymentStatus
        ? paymentLabels[order.paymentStatus] || order.paymentStatus
        : '',
      recipientName,
      addressStr,
      order.notes || order.note || '',
    ]
  })

  const csv = arrayToCsv(headers, rows)

  const dateSuffix = dateRange
    ? `_${dateRange.start}_${dateRange.end}`
    : `_${new Date().toISOString().slice(0, 10)}`

  downloadCsv(csv, `訂單匯出${dateSuffix}.csv`)
}
