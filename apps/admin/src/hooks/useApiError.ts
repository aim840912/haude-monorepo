import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ErrorCode,
  ApiErrorResponse,
  ErrorCodeMessages,
  isApiErrorResponse,
} from '@haude/types'
import { useAuthStore } from '../stores/authStore'

/**
 * 錯誤處理配置
 */
interface ErrorHandlerConfig {
  /** 自訂錯誤訊息（覆蓋預設訊息） */
  customMessage?: string
  /** 認證錯誤時是否自動登出並重定向（預設 true） */
  handleAuthError?: boolean
  /** 忽略的錯誤代碼（不觸發任何處理） */
  ignoreErrorCodes?: ErrorCode[]
  /** 自訂通知回調（用於顯示 toast 或 alert） */
  onNotify?: (type: 'error' | 'warning' | 'info', title: string, message?: string) => void
}

/**
 * 錯誤處理結果
 */
interface ErrorHandlerResult {
  /** 錯誤代碼 */
  errorCode: ErrorCode | string
  /** 錯誤訊息 */
  message: string
  /** HTTP 狀態碼 */
  statusCode: number
  /** 是否需要重新認證 */
  requiresAuth: boolean
  /** 建議的通知類型 */
  notificationType: 'error' | 'warning' | 'info'
  /** 建議的通知標題 */
  notificationTitle: string
}

/**
 * API 錯誤處理 Hook（Admin 版本）
 *
 * 提供統一的 API 錯誤處理邏輯，包括：
 * - 根據錯誤代碼返回對應的中文訊息
 * - 認證錯誤自動登出並重定向到登入頁
 * - 返回結構化的錯誤資訊供調用者處理
 *
 * @example
 * ```tsx
 * const { handleError, handleAxiosError } = useApiError()
 *
 * try {
 *   await api.put(`/admin/products/${id}`, data)
 * } catch (error) {
 *   const result = handleAxiosError(error, {
 *     onNotify: (type, title, message) => {
 *       // 使用自訂通知方式
 *       alert(`${title}: ${message}`)
 *     }
 *   })
 * }
 * ```
 */
export function useApiError() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)

  /**
   * 根據錯誤代碼獲取通知類型
   */
  const getNotificationType = useCallback(
    (errorCode: ErrorCode | string, statusCode: number): 'error' | 'warning' | 'info' => {
      // 認證相關錯誤用 warning
      if ([
        ErrorCode.TOKEN_EXPIRED,
        ErrorCode.TOKEN_INVALID,
        ErrorCode.UNAUTHORIZED,
        ErrorCode.ACCOUNT_DISABLED,
      ].includes(errorCode as ErrorCode)) {
        return 'warning'
      }

      // 業務邏輯錯誤用 warning
      if ([
        ErrorCode.INSUFFICIENT_STOCK,
        ErrorCode.EMAIL_EXISTS,
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ErrorCode.CART_EMPTY,
      ].includes(errorCode as ErrorCode)) {
        return 'warning'
      }

      // 伺服器錯誤用 error
      if (statusCode >= 500) {
        return 'error'
      }

      return 'error'
    },
    []
  )

  /**
   * 根據錯誤代碼獲取通知標題
   */
  const getNotificationTitle = useCallback((errorCode: ErrorCode | string): string => {
    switch (errorCode) {
      case ErrorCode.TOKEN_EXPIRED:
      case ErrorCode.TOKEN_INVALID:
      case ErrorCode.UNAUTHORIZED:
        return '登入已過期'
      case ErrorCode.ACCOUNT_DISABLED:
        return '帳號已停用'
      case ErrorCode.FORBIDDEN:
      case ErrorCode.INSUFFICIENT_PERMISSIONS:
        return '權限不足'
      case ErrorCode.INSUFFICIENT_STOCK:
        return '庫存不足'
      case ErrorCode.EMAIL_EXISTS:
        return '註冊失敗'
      case ErrorCode.INVALID_CREDENTIALS:
        return '登入失敗'
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return '請求過於頻繁'
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
        return '輸入錯誤'
      default:
        return '操作失敗'
    }
  }, [])

  /**
   * 處理 API 錯誤回應
   */
  const handleError = useCallback(
    (error: ApiErrorResponse, config: ErrorHandlerConfig = {}): ErrorHandlerResult => {
      const {
        customMessage,
        handleAuthError = true,
        ignoreErrorCodes = [],
        onNotify,
      } = config

      const errorCode = error.errorCode as ErrorCode
      const message = customMessage || error.message || ErrorCodeMessages[errorCode] || '發生未知錯誤'
      const notificationType = getNotificationType(errorCode, error.statusCode)
      const notificationTitle = getNotificationTitle(errorCode)

      // 檢查是否應忽略此錯誤
      if (ignoreErrorCodes.includes(errorCode)) {
        return {
          errorCode,
          message,
          statusCode: error.statusCode,
          requiresAuth: false,
          notificationType,
          notificationTitle,
        }
      }

      let requiresAuth = false

      // 處理認證相關錯誤
      if (handleAuthError) {
        switch (errorCode) {
          case ErrorCode.TOKEN_EXPIRED:
          case ErrorCode.TOKEN_INVALID:
          case ErrorCode.UNAUTHORIZED:
            logout()
            if (onNotify) {
              onNotify('warning', '登入已過期', '請重新登入以繼續操作')
            }
            navigate('/login', { replace: true })
            requiresAuth = true
            break

          case ErrorCode.ACCOUNT_DISABLED:
            logout()
            if (onNotify) {
              onNotify('error', '帳號已停用', '請聯繫系統管理員')
            }
            navigate('/login', { replace: true })
            requiresAuth = true
            break

          case ErrorCode.FORBIDDEN:
          case ErrorCode.INSUFFICIENT_PERMISSIONS:
            if (onNotify) {
              onNotify('error', '權限不足', message)
            }
            break
        }
      }

      // 如果有自訂通知回調且尚未處理，執行通知
      if (onNotify && !requiresAuth) {
        onNotify(notificationType, notificationTitle, message)
      }

      return {
        errorCode,
        message,
        statusCode: error.statusCode,
        requiresAuth,
        notificationType,
        notificationTitle,
      }
    },
    [logout, navigate, getNotificationType, getNotificationTitle]
  )

  /**
   * 處理 Axios 錯誤
   * 自動從 Axios 錯誤物件中提取 API 錯誤回應
   */
  const handleAxiosError = useCallback(
    (error: unknown, config: ErrorHandlerConfig = {}): ErrorHandlerResult | null => {
      // 檢查是否為 Axios 錯誤（有 response 屬性）
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        const data = (error.response as { data: unknown }).data

        if (isApiErrorResponse(data)) {
          return handleError(data, config)
        }
      }

      // 非 API 錯誤，返回通用錯誤資訊
      const { onNotify, customMessage } = config
      const message =
        customMessage ||
        (error instanceof Error ? error.message : '發生網路錯誤，請檢查網路連線')

      if (onNotify) {
        onNotify('error', '連線失敗', message)
      }

      return {
        errorCode: 'NETWORK_ERROR',
        message,
        statusCode: 0,
        requiresAuth: false,
        notificationType: 'error',
        notificationTitle: '連線失敗',
      }
    },
    [handleError]
  )

  /**
   * 檢查錯誤是否為特定類型
   */
  const isErrorCode = useCallback(
    (error: unknown, codes: ErrorCode | ErrorCode[]): boolean => {
      const codeArray = Array.isArray(codes) ? codes : [codes]

      if (isApiErrorResponse(error)) {
        return codeArray.includes(error.errorCode as ErrorCode)
      }

      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        const data = (error.response as { data: unknown }).data
        if (isApiErrorResponse(data)) {
          return codeArray.includes(data.errorCode as ErrorCode)
        }
      }

      return false
    },
    []
  )

  /**
   * 獲取錯誤訊息
   */
  const getErrorMessage = useCallback((code: ErrorCode): string => {
    return ErrorCodeMessages[code] || '發生未知錯誤'
  }, [])

  return {
    handleError,
    handleAxiosError,
    isErrorCode,
    getErrorMessage,
    ErrorCode,
    ErrorCodeMessages,
  }
}
