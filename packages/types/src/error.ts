/**
 * 統一錯誤處理型別
 *
 * 此模組定義前後端共用的錯誤代碼和錯誤回應格式，
 * 使前端能夠根據錯誤代碼進行程式化的錯誤處理。
 */

/**
 * 統一錯誤代碼枚舉
 * 前端可根據這些代碼進行程式化錯誤處理
 */
export enum ErrorCode {
  // === 驗證錯誤 (400) ===
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_UUID = 'INVALID_UUID',

  // === 認證錯誤 (401) ===
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // === 權限錯誤 (403) ===
  FORBIDDEN = 'FORBIDDEN',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // === 資源錯誤 (404) ===
  NOT_FOUND = 'NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CART_NOT_FOUND = 'CART_NOT_FOUND',
  DISCOUNT_NOT_FOUND = 'DISCOUNT_NOT_FOUND',
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',

  // === 衝突錯誤 (409) ===
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // === 業務邏輯錯誤 (422) ===
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  CANNOT_DELETE = 'CANNOT_DELETE',
  INVALID_DISCOUNT = 'INVALID_DISCOUNT',
  DISCOUNT_EXPIRED = 'DISCOUNT_EXPIRED',
  DISCOUNT_LIMIT_EXCEEDED = 'DISCOUNT_LIMIT_EXCEEDED',
  ORDER_CANNOT_CANCEL = 'ORDER_CANNOT_CANCEL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CART_EMPTY = 'CART_EMPTY',

  // === 請求限制 (429) ===
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // === 伺服器錯誤 (500) ===
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * API 錯誤回應介面
 * 定義後端統一回傳的錯誤格式
 */
export interface ApiErrorResponse {
  /** HTTP 狀態碼 */
  statusCode: number
  /** 錯誤代碼（用於程式化處理） */
  errorCode: ErrorCode | string
  /** 人類可讀的錯誤訊息 */
  message: string
  /** 錯誤發生的時間戳記 (ISO 8601) */
  timestamp: string
  /** 請求的路徑 */
  path: string
}

/**
 * 型別守衛：檢查是否為 API 錯誤回應
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'errorCode' in error &&
    'message' in error
  )
}

/**
 * 錯誤代碼與預設訊息的對應表
 * 可用於前端顯示友善的錯誤訊息
 */
export const ErrorCodeMessages: Record<ErrorCode, string> = {
  // 驗證錯誤
  [ErrorCode.VALIDATION_ERROR]: '輸入資料驗證失敗',
  [ErrorCode.INVALID_INPUT]: '輸入資料格式不正確',
  [ErrorCode.INVALID_UUID]: '無效的識別碼格式',

  // 認證錯誤
  [ErrorCode.INVALID_CREDENTIALS]: '帳號或密碼錯誤',
  [ErrorCode.TOKEN_EXPIRED]: '登入已過期，請重新登入',
  [ErrorCode.TOKEN_INVALID]: '驗證失敗，請重新登入',
  [ErrorCode.UNAUTHORIZED]: '請先登入',

  // 權限錯誤
  [ErrorCode.FORBIDDEN]: '您沒有權限執行此操作',
  [ErrorCode.ACCOUNT_DISABLED]: '帳號已被停用',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: '權限不足',

  // 資源錯誤
  [ErrorCode.NOT_FOUND]: '找不到請求的資源',
  [ErrorCode.PRODUCT_NOT_FOUND]: '找不到此商品',
  [ErrorCode.ORDER_NOT_FOUND]: '找不到此訂單',
  [ErrorCode.USER_NOT_FOUND]: '找不到此使用者',
  [ErrorCode.CART_NOT_FOUND]: '購物車不存在',
  [ErrorCode.DISCOUNT_NOT_FOUND]: '找不到此折扣碼',
  [ErrorCode.REVIEW_NOT_FOUND]: '找不到此評論',
  [ErrorCode.CATEGORY_NOT_FOUND]: '找不到此分類',

  // 衝突錯誤
  [ErrorCode.EMAIL_EXISTS]: '此電子郵件已被註冊',
  [ErrorCode.RESOURCE_CONFLICT]: '資源衝突，請稍後再試',
  [ErrorCode.DUPLICATE_ENTRY]: '資料重複',

  // 業務邏輯錯誤
  [ErrorCode.INSUFFICIENT_STOCK]: '商品庫存不足',
  [ErrorCode.CANNOT_DELETE]: '無法刪除此項目',
  [ErrorCode.INVALID_DISCOUNT]: '折扣碼無效',
  [ErrorCode.DISCOUNT_EXPIRED]: '折扣碼已過期',
  [ErrorCode.DISCOUNT_LIMIT_EXCEEDED]: '折扣碼使用次數已達上限',
  [ErrorCode.ORDER_CANNOT_CANCEL]: '此訂單無法取消',
  [ErrorCode.PAYMENT_FAILED]: '付款失敗',
  [ErrorCode.CART_EMPTY]: '購物車是空的',

  // 請求限制
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '請求過於頻繁，請稍後再試',

  // 伺服器錯誤
  [ErrorCode.INTERNAL_ERROR]: '伺服器發生錯誤，請稍後再試',
  [ErrorCode.DATABASE_ERROR]: '資料庫錯誤，請稍後再試',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服務錯誤，請稍後再試',
}
