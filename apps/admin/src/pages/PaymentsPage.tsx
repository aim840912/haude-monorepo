import { useState } from 'react'
import {
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  RotateCcw,
} from 'lucide-react'
import {
  usePayments,
  usePaymentLogs,
  usePaymentStats,
  type Payment,
} from '../hooks/usePayments'
import { RefundModal } from '../components/RefundModal'

const statusLabels: Record<Payment['status'], string> = {
  pending: '待付款',
  paid: '已付款',
  failed: '付款失敗',
  refunded: '已退款',
}

const statusColors: Record<Payment['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const logTypeLabels: Record<string, string> = {
  notify: '付款通知',
  return: '返回頁面',
  error: '錯誤',
}

const logTypeColors: Record<string, string> = {
  notify: 'bg-blue-100 text-blue-800',
  return: 'bg-purple-100 text-purple-800',
  error: 'bg-red-100 text-red-800',
}

export function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'payments' | 'logs'>('payments')
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null)

  const {
    payments,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments()

  const {
    logs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = usePaymentLogs()

  const { stats, isLoading: statsLoading, refetch: refetchStats } = usePaymentStats()

  const handleRefresh = () => {
    refetchPayments()
    refetchLogs()
    refetchStats()
  }

  // 過濾付款記錄
  const filteredPayments = payments.filter(
    (payment) =>
      payment.merchantOrderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 過濾付款日誌
  const filteredLogs = logs.filter((log) =>
    log.merchantOrderNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isLoading = activeTab === 'payments' ? paymentsLoading : logsLoading
  const error = activeTab === 'payments' ? paymentsError : logsError

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">付款監控</h1>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* 統計卡片 */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <StatCard
            icon={CreditCard}
            label="總付款數"
            value={stats.totalPayments}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="成功付款"
            value={stats.paidPayments}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="待處理"
            value={stats.pendingPayments}
            color="yellow"
          />
          <StatCard
            icon={XCircle}
            label="失敗"
            value={stats.failedPayments}
            color="red"
          />
          <StatCard
            icon={RotateCcw}
            label="已退款"
            value={stats.refundedPayments}
            color="gray"
          />
          <StatCard
            icon={DollarSign}
            label="總金額"
            value={`NT$ ${stats.totalAmount.toLocaleString()}`}
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            label="退款總額"
            value={`NT$ ${stats.totalRefunded.toLocaleString()}`}
            color="gray"
          />
          <StatCard
            icon={AlertTriangle}
            label="驗證失敗"
            value={stats.verificationFailures}
            color={stats.verificationFailures > 0 ? 'red' : 'gray'}
            highlight={stats.verificationFailures > 0}
          />
        </div>
      )}

      {/* 標籤頁切換 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'payments'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          付款記錄
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          回調日誌
        </button>
      </div>

      {/* 搜尋欄 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'payments'
                ? '搜尋訂單編號、客戶名稱或 Email...'
                : '搜尋訂單編號...'
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4" />
            重試
          </button>
        </div>
      )}

      {/* 付款記錄表格 */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '找不到符合的付款記錄' : '尚無付款記錄'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      交易編號
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      訂單
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      客戶
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      金額
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      狀態
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      付款時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      建立時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900">
                          {payment.merchantOrderNo}
                        </div>
                        {payment.tradeNo && (
                          <div className="font-mono text-xs text-gray-500">
                            ECPay: {payment.tradeNo}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{payment.orderNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{payment.userName || '-'}</div>
                        <div className="text-xs text-gray-500">{payment.userEmail || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                        NT$ {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[payment.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusLabels[payment.status] || payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {payment.payTime
                          ? new Date(payment.payTime).toLocaleString('zh-TW')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(payment.createdAt).toLocaleString('zh-TW')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {payment.status === 'paid' && (
                          <button
                            onClick={() => setRefundPayment(payment)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            退款
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 回調日誌表格 */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '找不到符合的日誌' : '尚無回調日誌'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      訂單編號
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      類型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      驗證
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      處理
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      來源 IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      付款狀態
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-gray-50 ${
                        !log.verified ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(log.createdAt).toLocaleString('zh-TW')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">
                          {log.merchantOrderNo}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            logTypeColors[log.logType] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {logTypeLabels[log.logType] || log.logType}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {log.verified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {log.processed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm font-mono">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {log.paymentStatus && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[log.paymentStatus as Payment['status']] ||
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {statusLabels[log.paymentStatus as Payment['status']] ||
                              log.paymentStatus}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 記錄數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {activeTab === 'payments' ? filteredPayments.length : filteredLogs.length} 筆
        {activeTab === 'payments' ? '付款記錄' : '回調日誌'}
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 退款 Modal */}
      {refundPayment && (
        <RefundModal
          payment={refundPayment}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => {
            setRefundPayment(null)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}

// 統計卡片元件
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  highlight?: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 ${
        highlight ? 'ring-2 ring-red-500' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-lg font-semibold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  )
}
