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
