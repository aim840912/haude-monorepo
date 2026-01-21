/**
 * 系統狀態與維護模式型別定義
 *
 * 此模組定義系統通知、維護模式和全域狀態相關的型別，
 * 用於前端顯示系統公告和維護頁面。
 */

/**
 * 系統通知類型
 * - info: 一般資訊公告
 * - warning: 警告通知（如服務降級）
 * - error: 錯誤通知（如部分功能異常）
 * - maintenance: 維護通知
 */
export type SystemBannerType = 'info' | 'warning' | 'error' | 'maintenance'

/**
 * 系統通知介面
 * 用於顯示全站通知欄
 */
export interface SystemBanner {
  /** 唯一識別碼 */
  id: string
  /** 通知類型 */
  type: SystemBannerType
  /** 通知標題 */
  title: string
  /** 通知內容（可選） */
  message?: string
  /** 是否可關閉 */
  dismissible: boolean
  /** 過期時間（ISO 8601 格式） */
  expiresAt?: string
  /** 連結（可選） */
  link?: {
    text: string
    url: string
  }
  /** 建立時間（ISO 8601 格式） */
  createdAt: string
}

/**
 * 維護狀態介面
 * 用於控制系統維護模式
 */
export interface MaintenanceStatus {
  /** 是否處於維護模式 */
  isMaintenanceMode: boolean
  /** 維護訊息 */
  message?: string
  /** 預計結束時間（ISO 8601 格式） */
  estimatedEndTime?: string
  /** 允許存取的角色（維護期間可繞過） */
  allowedRoles?: ('ADMIN' | 'STAFF')[]
}

/**
 * 系統狀態回應介面
 * GET /api/v1/system/status 的回應格式
 */
export interface SystemStatusResponse {
  /** 系統狀態 */
  status: 'ok' | 'degraded' | 'maintenance'
  /** 時間戳記（ISO 8601 格式） */
  timestamp: string
  /** 維護狀態 */
  maintenance: MaintenanceStatus
  /** 系統公告列表 */
  banners: SystemBanner[]
}

/**
 * 建立系統公告的請求資料
 */
export interface CreateSystemBannerData {
  /** 通知類型 */
  type: SystemBannerType
  /** 通知標題 */
  title: string
  /** 通知內容（可選） */
  message?: string
  /** 是否可關閉（預設 true） */
  dismissible?: boolean
  /** 過期時間（ISO 8601 格式） */
  expiresAt?: string
  /** 連結（可選） */
  link?: {
    text: string
    url: string
  }
}

/**
 * 更新維護模式的請求資料
 */
export interface UpdateMaintenanceData {
  /** 是否啟用維護模式 */
  isMaintenanceMode: boolean
  /** 維護訊息 */
  message?: string
  /** 預計結束時間（ISO 8601 格式） */
  estimatedEndTime?: string
  /** 允許存取的角色 */
  allowedRoles?: ('ADMIN' | 'STAFF')[]
}
