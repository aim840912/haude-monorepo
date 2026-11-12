/**
 * 操作紀錄的顯示用工具：把 API 存的英文代碼轉成中文，並算出「改了哪些欄位」。
 */

export interface AuditLogMeta {
  method?: string
  path?: string
  label?: string
  before?: Record<string, unknown>
  body?: Record<string, unknown>
}

export const RESOURCE_LABELS: Record<string, string> = {
  products: '產品',
  orders: '訂單',
  discounts: '折扣碼',
  'farm-tours': '觀光果園',
  locations: '門市',
  schedules: '擺攤行程',
  'social-posts': '社群貼文',
  reviews: '評論',
  users: '會員帳號',
  members: '會員等級／積分',
  refunds: '退款',
  'site-settings': '網站設定',
  system: '系統維護',
  banners: '公告橫幅',
  'stock-alerts': '庫存預警',
}

export const ACTION_LABELS: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '修改',
  DELETE: '刪除',
  STATUS_CHANGE: '變更狀態',
  EXPORT: '匯出',
  IMPORT: '匯入',
}

const IMAGE_ACTION_LABELS: Record<string, string> = {
  POST: '新增圖片',
  PUT: '調整圖片',
  DELETE: '刪除圖片',
}

const FIELD_LABELS: Record<string, string> = {
  name: '名稱',
  title: '標題',
  description: '描述',
  price: '價格',
  priceUnit: '計價單位',
  stock: '庫存',
  inventory: '庫存',
  category: '分類',
  isActive: '上架／啟用',
  isDraft: '草稿',
  isReviewsVisible: '顯示評論',
  status: '狀態',
  role: '角色',
  memberLevel: '會員等級',
  level: '會員等級',
  points: '調整積分',
  currentPoints: '積分',
  code: '折扣碼',
  value: '數值',
  threshold: '預警門檻',
  isEnabled: '啟用',
  reason: '原因',
  amount: '金額',
  trackingNumber: '物流單號',
  url: '網址',
}

/** 動作的中文說明；圖片相關的子路由另外標示，避免看起來像刪掉整個產品。 */
export function actionLabel(action: string, meta: AuditLogMeta | null): string {
  if (meta?.path?.includes('/images') && meta.method) {
    const imageLabel = IMAGE_ACTION_LABELS[meta.method]
    if (imageLabel) return imageLabel
  }
  return ACTION_LABELS[action] ?? action
}

export function resourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '（空）'
  if (typeof value === 'boolean') return value ? '是' : '否'
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

export interface FieldChange {
  field: string
  from: unknown
  to: unknown
  /** 改前資料有這個欄位，才能顯示「舊 → 新」 */
  hasBefore: boolean
}

/**
 * 比對「改之前」與「送出的內容」，只列出真的有變的欄位。
 * 送出的欄位不在改前資料裡（新增、舊紀錄、或像積分調整量這種不是欄位值的參數）
 * → 只列送出的值，不假裝它原本是空的。
 */
export function describeChanges(meta: AuditLogMeta | null): FieldChange[] {
  const body = meta?.body
  if (!body) return []
  const before = meta.before ?? {}
  return Object.entries(body)
    .filter(([field, to]) => JSON.stringify(before[field]) !== JSON.stringify(to))
    .map(([field, to]) => {
      // Own keys only: `in` would also see Object.prototype (constructor, toString…)
      const hasBefore = Object.prototype.hasOwnProperty.call(before, field)
      return { field, from: hasBefore ? before[field] : undefined, to, hasBefore }
    })
}
