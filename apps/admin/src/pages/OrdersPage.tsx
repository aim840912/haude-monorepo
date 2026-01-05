import { Search, Eye } from 'lucide-react'
import { useState } from 'react'
import type { Order, OrderStatus } from '@haude/types'

// Mock data
const mockOrders: Partial<Order>[] = [
  { id: '1', orderNumber: 'ORD20260105001', status: 'pending', totalAmount: 2400, createdAt: '2026-01-05' },
  { id: '2', orderNumber: 'ORD20260104002', status: 'processing', totalAmount: 1800, createdAt: '2026-01-04' },
  { id: '3', orderNumber: 'ORD20260103003', status: 'delivered', totalAmount: 3200, createdAt: '2026-01-03' },
]

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

export function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">訂單管理</h1>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋訂單編號..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                訂單編號
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建立時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {order.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  NT$ {order.totalAmount?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[order.status as OrderStatus]
                    }`}
                  >
                    {statusLabels[order.status as OrderStatus]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="p-2 text-gray-600 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
