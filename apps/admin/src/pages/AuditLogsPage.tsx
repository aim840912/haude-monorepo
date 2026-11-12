import { Fragment, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import {
  useAuditLogs,
  useAuditOperators,
  type AuditLogEntry,
} from '../hooks/useAuditLogs'
import {
  ACTION_LABELS,
  RESOURCE_LABELS,
  actionLabel,
  describeChanges,
  fieldLabel,
  formatValue,
  resourceLabel,
} from '../lib/audit-format'

const PAGE_SIZE = 50

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
}

interface Filters {
  operatorId: string
  resource: string
  action: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = { operatorId: '', resource: '', action: '', from: '', to: '' }

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

export function AuditLogsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const operators = useAuditOperators()
  const { logs, total, isLoading, error, refetch } = useAuditLogs({
    ...filters,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作紀錄</h1>
          <p className="text-sm text-gray-500 mt-1">後台的新增、修改、刪除都會記錄，保留 365 天</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          aria-label="重新整理"
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <label className="block text-xs text-gray-500">
          操作者
          <select
            className={`${inputClass} mt-1`}
            value={filters.operatorId}
            onChange={(e) => updateFilter('operatorId', e.target.value)}
          >
            <option value="">全部</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}（{op.email}）
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-gray-500">
          類型
          <select
            className={`${inputClass} mt-1`}
            value={filters.resource}
            onChange={(e) => updateFilter('resource', e.target.value)}
          >
            <option value="">全部</option>
            {Object.entries(RESOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-gray-500">
          動作
          <select
            className={`${inputClass} mt-1`}
            value={filters.action}
            onChange={(e) => updateFilter('action', e.target.value)}
          >
            <option value="">全部</option>
            {['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'].map((value) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-gray-500">
          開始日期
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
          />
        </label>
        <label className="block text-xs text-gray-500">
          結束日期
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setFilters(EMPTY_FILTERS)
            setPage(0)
          }}
          className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          清除篩選
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : !isLoading && logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {hasFilters ? '沒有符合條件的紀錄' : '尚無操作紀錄'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['時間', '操作者', '動作', '類型', '對象', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            共 {total} 筆 · 第 {page + 1} / {totalPages} 頁
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="上一頁"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="下一頁"
              disabled={page + 1 >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLogEntry
  expanded: boolean
  onToggle: () => void
}) {
  const meta = log.metadata
  const target = meta?.label ?? (log.resourceId ? `#${log.resourceId.slice(0, 8)}` : '—')
  const changes = describeChanges(meta)

  return (
    <Fragment>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {new Date(log.createdAt).toLocaleString('zh-TW')}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
          {log.operator?.name ?? '（已刪除的帳號）'}
          <span className="block text-xs text-gray-400">{log.operator?.email}</span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {actionLabel(log.action, meta)}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
          {resourceLabel(log.resource)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={target}>
          {target}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? '收合詳細內容' : '展開詳細內容'}
            className="p-1 text-gray-400 hover:text-gray-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-3 text-sm">
            {changes.length > 0 ? (
              <ul className="space-y-1 mb-2">
                {changes.map((c) => (
                  <li key={c.field} className="text-gray-700">
                    <span className="font-medium">{fieldLabel(c.field)}</span>：
                    {meta?.before && (
                      <>
                        <span className="text-gray-500 line-through">{formatValue(c.from)}</span>
                        {' → '}
                      </>
                    )}
                    <span className="text-gray-900">{formatValue(c.to)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mb-2">
                {log.action === 'DELETE' && meta?.before ? '已刪除，刪除前的資料保存在紀錄中' : '沒有欄位變更內容'}
              </p>
            )}
            <p className="text-xs text-gray-400 break-all">
              {meta?.method} {meta?.path}
              {log.ipAddress && ` · IP ${log.ipAddress}`}
            </p>
          </td>
        </tr>
      )}
    </Fragment>
  )
}
