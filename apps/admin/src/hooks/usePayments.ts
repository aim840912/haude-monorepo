import { useState, useEffect, useCallback } from 'react'
import { paymentsApi } from '../services/api'

export interface Payment {
  id: string
  merchantOrderNo: string
  tradeNo: string | null
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount: number
  paymentType: string
  payTime: string | null
  createdAt: string
  orderNumber: string
  userName: string | null
  userEmail: string | null
}

export interface PaymentLog {
  id: string
  merchantOrderNo: string
  logType: string
  verified: boolean
  processed: boolean
  ipAddress: string | null
  createdAt: string
  paymentStatus: string | null
}

export interface PaymentStats {
  totalPayments: number
  paidPayments: number
  pendingPayments: number
  failedPayments: number
  totalAmount: number
  verificationFailures: number
}

interface UsePaymentsReturn {
  payments: Payment[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  total: number
}

export function usePayments(): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchPayments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await paymentsApi.getAll(100, 0)
      setPayments(data.data || [])
      setTotal(data.total || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入付款記錄失敗'
      setError(message)
      console.error('[usePayments] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments,
    total,
  }
}

interface UsePaymentLogsReturn {
  logs: PaymentLog[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  total: number
}

export function usePaymentLogs(): UsePaymentLogsReturn {
  const [logs, setLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await paymentsApi.getLogs(100, 0)
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入付款日誌失敗'
      setError(message)
      console.error('[usePaymentLogs] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    isLoading,
    error,
    refetch: fetchLogs,
    total,
  }
}

interface UsePaymentStatsReturn {
  stats: PaymentStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePaymentStats(): UsePaymentStatsReturn {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await paymentsApi.getStats()
      setStats(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入統計失敗'
      setError(message)
      console.error('[usePaymentStats] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}
