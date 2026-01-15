import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SalesDetailItem } from '../../services/api'

interface SalesTableProps {
  items: SalesDetailItem[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已確認', color: 'bg-blue-100 text-blue-800' },
  processing: { label: '處理中', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: '已出貨', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: '已送達', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
  refunded: { label: '已退款', color: 'bg-gray-100 text-gray-800' },
}

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '已付款', color: 'bg-green-100 text-green-800' },
  failed: { label: '付款失敗', color: 'bg-red-100 text-red-800' },
  refunded: { label: '已退款', color: 'bg-gray-100 text-gray-800' },
}

function StatusBadge({ status, type }: { status: string; type: 'order' | 'payment' }) {
  const labels = type === 'order' ? statusLabels : paymentStatusLabels
  const config = labels[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

export function SalesTable({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
}: SalesTableProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          載入中...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                訂單編號
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客戶
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品數
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                小計
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                折扣
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                運費
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                總計
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                訂單狀態
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                付款狀態
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  此期間沒有銷售記錄
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.orderNumber} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.productCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    NT$ {item.subtotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 text-right">
                    {item.discount > 0 ? `-NT$ ${item.discount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    NT$ {item.shipping.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    NT$ {item.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} type="order" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.paymentStatus} type="payment" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {total > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            顯示第 {startItem} - {endItem} 筆，共 {total} 筆
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              第 {page} / {totalPages} 頁
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
