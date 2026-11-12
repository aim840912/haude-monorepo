import { useState, useEffect, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { auditLogsApi, type AuditLogFilters } from '../services/api'
import type { AuditLogMeta } from '../lib/audit-format'
import logger from '../lib/logger'

export interface AuditOperator {
  id: string
  name: string
  email: string
  role: string
}

export interface AuditLogEntry {
  id: string
  operatorId: string
  action: string
  resource: string
  resourceId: string | null
  summary: string | null
  metadata: AuditLogMeta | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  operator: AuditOperator
}

function toMessage(err: unknown): string {
  if (isAxiosError(err) && err.response?.status === 403) {
    return '只有管理員可以查看操作紀錄'
  }
  return err instanceof Error ? err.message : '載入操作紀錄失敗'
}

export function useAuditLogs(filters: AuditLogFilters) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 以字串當依賴：filters 物件每次 render 都是新的
  const key = JSON.stringify(filters)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await auditLogsApi.getAll(JSON.parse(key) as AuditLogFilters)
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(toMessage(err))
      logger.error('[useAuditLogs] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [key])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, total, isLoading, error, refetch: fetchLogs }
}

export function useAuditOperators() {
  const [operators, setOperators] = useState<AuditOperator[]>([])

  useEffect(() => {
    auditLogsApi
      .getOperators()
      .then(({ data }) => setOperators(data || []))
      .catch((err) => logger.error('[useAuditOperators] API 錯誤', { error: err }))
  }, [])

  return operators
}
