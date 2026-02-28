import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Order, PaymentStatus } from '../hooks/useOrders'
import type { OrderStatus } from '@haude/types'

interface OrderStatusModalProps {
  order: Order
  isOpen: boolean
  isUpdating: boolean
  onClose: () => void
  onSave: (id: string, data: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => Promise<boolean>
}

const statusOptions: { value: OrderStatus; label: string; description: string }[] = [
  { value: 'pending', label: '待處理', description: '訂單已建立，等待確認' },
  { value: 'confirmed', label: '已確認', description: '訂單已確認，準備處理' },
  { value: 'processing', label: '處理中', description: '訂單正在準備中' },
  { value: 'shipped', label: '已出貨', description: '訂單已發貨' },
  { value: 'delivered', label: '已送達', description: '訂單已送達客戶' },
  { value: 'cancelled', label: '已取消', description: '訂單已取消' },
  { value: 'refunded', label: '已退款', description: '訂單已退款' },
]

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
  refunded: 'bg-red-100 text-red-800 border-red-300',
}

const paymentStatusOptions: { value: PaymentStatus; label: string; description: string }[] = [
  { value: 'pending',  label: '待付款',   description: '等待客戶付款' },
  { value: 'paid',     label: '已付款',   description: '已確認收到款項' },
  { value: 'failed',   label: '付款失敗', description: '付款處理失敗' },
  { value: 'refunded', label: '已退款',   description: '已退還款項' },
  { value: 'expired',  label: '已過期',   description: '付款期限已過' },
]

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  paid:     'bg-green-100 text-green-800 border-green-300',
  failed:   'bg-red-100 text-red-800 border-red-300',
  refunded: 'bg-purple-100 text-purple-800 border-purple-300',
  expired:  'bg-gray-100 text-gray-800 border-gray-300',
}

export function OrderStatusModal({
  order,
  isOpen,
  isUpdating,
  onClose,
  onSave,
}: OrderStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>(order.paymentStatus ?? 'pending')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status)
      setSelectedPaymentStatus(order.paymentStatus ?? 'pending')
      setError(null)
    }
  }, [order])

  if (!isOpen) return null

  const hasChanges =
    selectedStatus !== order.status ||
    selectedPaymentStatus !== (order.paymentStatus ?? 'pending')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasChanges) {
      onClose()
      return
    }

    const data: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {}
    if (selectedStatus !== order.status) data.status = selectedStatus
    if (selectedPaymentStatus !== (order.paymentStatus ?? 'pending')) data.paymentStatus = selectedPaymentStatus

    const success = await onSave(order.id, data)

    if (success) {
      onClose()
    } else {
      setError('更新狀態失敗，請稍後再試')
    }
  }

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUpdating) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">更新訂單狀態</h2>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 訂單資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">訂單編號</div>
            <div className="font-medium text-gray-900">{order.orderNumber}</div>
            <div className="mt-2 text-sm text-gray-500">訂單金額</div>
            <div className="font-medium text-gray-900">NT$ {order.totalAmount?.toLocaleString()}</div>
          </div>

          {/* 訂單狀態選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              訂單狀態
            </label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStatus === option.value
                      ? `${statusColors[option.value]} border-2`
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    disabled={isUpdating}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                  {selectedStatus === option.value && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 付款狀態選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              付款狀態
            </label>
            <div className="space-y-2">
              {paymentStatusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentStatus === option.value
                      ? `${paymentStatusColors[option.value]} border-2`
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentStatus"
                    value={option.value}
                    checked={selectedPaymentStatus === option.value}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                    disabled={isUpdating}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                  {selectedPaymentStatus === option.value && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUpdating || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? '更新中...' : '更新狀態'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
