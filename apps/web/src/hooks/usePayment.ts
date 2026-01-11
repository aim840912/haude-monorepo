import { useState, useCallback } from 'react'
import { paymentsApi } from '@/services/api'

interface PaymentFormData {
  action: string
  method: 'POST'
  fields: Record<string, string | number>
}

interface UsePaymentReturn {
  /** 發起付款流程 */
  initiatePayment: (orderId: string, paymentMethod?: string) => Promise<boolean>
  /** 是否正在處理中 */
  isProcessing: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 清除錯誤 */
  clearError: () => void
}

/**
 * 付款 Hook
 *
 * 處理綠界金流付款流程：
 * 1. 呼叫後端 API 取得加密參數
 * 2. 建立隱藏表單並自動提交到綠界
 * 3. 用戶在綠界頁面完成付款後會被導回
 *
 * @example
 * ```tsx
 * const { initiatePayment, isProcessing, error } = usePayment()
 *
 * const handlePay = async () => {
 *   const success = await initiatePayment(orderId)
 *   // success 為 true 表示已導向綠界
 * }
 * ```
 */
export function usePayment(): UsePaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 提交表單到綠界
   *
   * 建立一個隱藏的 form 元素，填入加密資料後自動提交
   * 這樣瀏覽器會導向到綠界的付款頁面
   */
  const submitToECPay = useCallback((formData: PaymentFormData) => {
    // 建立隱藏表單
    const form = document.createElement('form')
    form.method = formData.method
    form.action = formData.action
    form.style.display = 'none'
    // 設定編碼為 UTF-8
    form.acceptCharset = 'UTF-8'

    // 加入表單欄位
    Object.entries(formData.fields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = String(value)
      form.appendChild(input)
    })

    // 加入到 DOM 並提交
    document.body.appendChild(form)
    form.submit()
  }, [])

  const initiatePayment = useCallback(
    async (orderId: string, paymentMethod?: string): Promise<boolean> => {
      setIsProcessing(true)
      setError(null)

      try {
        const { data } = await paymentsApi.create(orderId, paymentMethod)

        if (!data.success || !data.data?.formData) {
          throw new Error('無法取得付款資料')
        }

        // 提交到綠界
        submitToECPay(data.data.formData)
        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '付款初始化失敗，請稍後再試'
        setError(message)
        setIsProcessing(false)
        return false
      }
      // 注意：成功時不會執行 setIsProcessing(false)
      // 因為頁面會被導向到綠界，不需要重置狀態
    },
    [submitToECPay]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    initiatePayment,
    isProcessing,
    error,
    clearError,
  }
}

interface UsePaymentStatusReturn {
  /** 付款狀態 */
  status: 'pending' | 'paid' | 'failed' | 'expired' | null
  /** 付款時間 */
  payTime: string | null
  /** 綠界交易編號 */
  tradeNo: string | null
  /** 是否載入中 */
  isLoading: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 重新查詢 */
  refetch: () => Promise<void>
}

/**
 * 付款狀態查詢 Hook
 *
 * @example
 * ```tsx
 * const { status, payTime, isLoading } = usePaymentStatus(orderId)
 * ```
 */
export function usePaymentStatus(orderId: string | undefined): UsePaymentStatusReturn {
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed' | 'expired' | null>(null)
  const [payTime, setPayTime] = useState<string | null>(null)
  const [tradeNo, setTradeNo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!orderId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await paymentsApi.getStatus(orderId)
      if (data.success && data.data) {
        setStatus(data.data.status)
        setPayTime(data.data.payTime || null)
        setTradeNo(data.data.tradeNo || null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢付款狀態失敗'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  return {
    status,
    payTime,
    tradeNo,
    isLoading,
    error,
    refetch: fetchStatus,
  }
}
