'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ErrorCode,
  ApiErrorResponse,
  ErrorCodeMessages,
  isApiErrorResponse,
} from '@haude/types'
import { useToast } from '@/components/ui/feedback/toast'
import { useAuthStore } from '@/stores/authStore'

/**
 * 錯誤處理配置
 */
interface ErrorHandlerConfig {
  /** 是否顯示 toast 通知（預設 true） */
  showToast?: boolean
  /** 自訂錯誤訊息（覆蓋預設訊息） */
  customMessage?: string
  /** 認證錯誤時是否自動登出並重定向（預設 true） */
  handleAuthError?: boolean
  /** 忽略的錯誤代碼（不顯示 toast） */
  ignoreErrorCodes?: ErrorCode[]
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
  /** 是否已處理（已顯示 toast 或執行其他操作） */
  handled: boolean
}

/**
 * API 錯誤處理 Hook
 *
 * 提供統一的 API 錯誤處理邏輯，包括：
 * - 根據錯誤代碼顯示對應的中文訊息
 * - 認證錯誤自動登出並重定向到登入頁
 * - 庫存不足等業務錯誤的特殊處理
 *
 * @example
 * ```tsx
 * const { handleError, handleAxiosError } = useApiError()
 *
 * try {
 *   await api.post('/orders', data)
 * } catch (error) {
 *   handleAxiosError(error)
 * }
 * ```
 */
export function useApiError() {
  const router = useRouter()
  const toast = useToast()
  const logout = useAuthStore(state => state.logout)

  /**
   * 處理 API 錯誤回應
   */
  const handleError = useCallback(
    (error: ApiErrorResponse, config: ErrorHandlerConfig = {}): ErrorHandlerResult => {
      const {
        showToast: shouldShowToast = true,
        customMessage,
        handleAuthError = true,
        ignoreErrorCodes = [],
      } = config

      const errorCode = error.errorCode as ErrorCode
      const message = customMessage || error.message || ErrorCodeMessages[errorCode] || '發生未知錯誤'

      // 檢查是否應忽略此錯誤
      if (ignoreErrorCodes.includes(errorCode)) {
        return {
          errorCode,
          message,
          statusCode: error.statusCode,
          handled: false,
        }
      }

      let handled = false

      // 處理認證相關錯誤
      if (handleAuthError) {
        switch (errorCode) {
          case ErrorCode.TOKEN_EXPIRED:
          case ErrorCode.TOKEN_INVALID:
          case ErrorCode.UNAUTHORIZED:
            logout()
            if (shouldShowToast) {
              toast.warning('登入已過期', '請重新登入以繼續操作')
            }
            router.replace('/login')
            handled = true
            break

          case ErrorCode.ACCOUNT_DISABLED:
            logout()
            if (shouldShowToast) {
              toast.error('帳號已停用', '請聯繫客服了解詳情')
            }
            router.replace('/login')
            handled = true
            break

          case ErrorCode.FORBIDDEN:
          case ErrorCode.INSUFFICIENT_PERMISSIONS:
            if (shouldShowToast) {
              toast.error('權限不足', message)
            }
            handled = true
            break
        }
      }

      // 處理業務邏輯錯誤
      if (!handled) {
        switch (errorCode) {
          case ErrorCode.INSUFFICIENT_STOCK:
            if (shouldShowToast) {
              toast.warning('庫存不足', message)
            }
            handled = true
            break

          case ErrorCode.CART_EMPTY:
            if (shouldShowToast) {
              toast.info('購物車是空的', '請先加入商品')
            }
            handled = true
            break

          case ErrorCode.EMAIL_EXISTS:
            if (shouldShowToast) {
              toast.warning('註冊失敗', message)
            }
            handled = true
            break

          case ErrorCode.INVALID_CREDENTIALS:
            if (shouldShowToast) {
              toast.error('登入失敗', message)
            }
            handled = true
            break

          case ErrorCode.RATE_LIMIT_EXCEEDED:
            if (shouldShowToast) {
              toast.warning('請求過於頻繁', '請稍後再試')
            }
            handled = true
            break

          default:
            // 通用錯誤處理
            if (shouldShowToast) {
              if (error.statusCode >= 500) {
                toast.error('伺服器錯誤', '請稍後再試，如問題持續請聯繫客服')
              } else {
                toast.error('操作失敗', message)
              }
            }
            handled = true
        }
      }

      return {
        errorCode,
        message,
        statusCode: error.statusCode,
        handled,
      }
    },
    [logout, router, toast]
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

      // 非 API 錯誤，顯示通用錯誤訊息
      const { showToast: shouldShowToast = true, customMessage } = config

      if (shouldShowToast) {
        const message =
          customMessage ||
          (error instanceof Error ? error.message : '發生網路錯誤，請檢查網路連線')
        toast.error('連線失敗', message)
      }

      return null
    },
    [handleError, toast]
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

  return {
    handleError,
    handleAxiosError,
    isErrorCode,
    ErrorCode,
  }
}
