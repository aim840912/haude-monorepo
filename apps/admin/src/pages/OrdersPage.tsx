import { useState } from 'react'
import { Search, Eye, RefreshCw, Edit, Loader2 } from 'lucide-react'
import { useOrders, Order, PaymentStatus } from '../hooks/useOrders'
import { OrderStatusModal } from '../components/OrderStatusModal'
import { OrderDetailModal, OrderDetail } from '../components/OrderDetailModal'
import { ordersApi } from '../services/api'
import type { OrderStatus } from '@haude/types'

const statusLabels: Record<OrderStatus, string> = {
  pending: '待處理',
  confirmed: '已確認',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  cancelled: '已取消',
  refunded: '已退款',
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-red-100 text-red-800',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  failed: '付款失敗',
  refunded: '已退款',
  expired: '已過期',
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  expired: 'bg-gray-100 text-gray-800',
}

export function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { orders, isLoading, error, refetch, updateOrderStatus, isUpdating } = useOrders()

  // 查看訂單詳情
  const handleViewDetail = async (orderId: string) => {
    setDetailLoading(true)
    try {
      const { data } = await ordersApi.getById(orderId)
      setViewingOrder(data)
    } catch {
      // 錯誤時關閉 Modal
      setViewingOrder(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // 過濾訂單
  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
        <button
          onClick={refetch}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋訂單編號、客戶名稱或 Email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '找不到符合的訂單' : '尚無訂單'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建立時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{order.userName || '-'}</div>
                    <div className="text-sm text-gray-500">{order.userEmail || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    NT$ {order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.paymentStatus ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="更新狀態"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewDetail(order.id)}
                      disabled={detailLoading}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="查看詳情"
                    >
                      {detailLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 訂單數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {filteredOrders.length} 筆訂單
        {searchQuery && ` (搜尋結果)`}
      </div>

      {/* 狀態更新 Modal */}
      {editingOrder && (
        <OrderStatusModal
          order={editingOrder}
          isOpen={!!editingOrder}
          isUpdating={isUpdating}
          onClose={() => setEditingOrder(null)}
          onSave={updateOrderStatus}
        />
      )}

      {/* 訂單詳情 Modal */}
      <OrderDetailModal
        order={viewingOrder}
        isOpen={!!viewingOrder || detailLoading}
        isLoading={detailLoading}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  )
}
