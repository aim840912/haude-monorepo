import { api } from './client'

// ==================== Audit Logs API ====================
// 後台操作紀錄（僅管理員）

export interface AuditLogFilters {
  operatorId?: string
  resource?: string
  action?: string
  /** YYYY-MM-DD，台灣時間 */
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export const auditLogsApi = {
  getAll: (filters: AuditLogFilters) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    )
    return api.get('/admin/audit-logs', { params })
  },
  getOperators: () => api.get('/admin/audit-logs/operators'),
}
