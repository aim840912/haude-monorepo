import { X, Package, Truck, CreditCard, User, MapPin, FileText } from 'lucide-react'
import type { OrderStatus } from '@haude/types'
import type { PaymentStatus } from '../hooks/useOrders'

// 訂單詳情的完整型別（API 回傳格式）
export interface OrderDetail {
  id: string
  orderNumber: string
  userId: string
  userName?: string
  userEmail?: string
  status: OrderStatus
  subtotal?: number
  shippingFee?: number
  tax?: number
  discountCode?: string | null
  discountAmount?: number
  totalAmount: number
  shippingAddress?: {
    name?: string
    phone?: string
    street?: string
    city?: string
    postalCode?: string
    country?: string
    notes?: string
  } | string
  paymentMethod?: string
  paymentStatus?: PaymentStatus
  payment?: {
    id: string
    status: PaymentStatus
    paymentType?: string
    bankCode?: string
    vaAccount?: string
    paymentCode?: string
    expireDate?: string | null
    payTime?: string | null
  } | null
  items: {
    id?: string
    productId: string
    productName: string
    productImage?: string
    quantity: number
    unitPrice: number
    priceUnit?: string
    subtotal: number
  }[]
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface OrderDetailModalProps {
  order: OrderDetail | null
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
}

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
  refunded: 'bg-orange-100 text-orange-800',
  expired: 'bg-gray-100 text-gray-800',
}

const paymentMethodLabels: Record<string, string> = {
  CREDIT: '信用卡',
  VACC: 'ATM 轉帳',
  CVS: '超商付款',
  WEBATM: '網路 ATM',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

export function OrderDetailModal({
  order,
  isOpen,
  isLoading,
  onClose,
}: OrderDetailModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // 解析 shippingAddress（可能是字串或物件）
  const getShippingAddress = () => {
    if (!order?.shippingAddress) return null
    if (typeof order.shippingAddress === 'string') {
      return { fullAddress: order.shippingAddress }
    }
    return order.shippingAddress
  }

  const shippingAddr = getShippingAddress()

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">訂單詳情</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : order ? (
            <>
              {/* 訂單基本資訊 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">訂單資訊</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">訂單編號</span>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">建立時間</span>
                    <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">訂單狀態</span>
                    <p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">付款狀態</span>
                    <p>
                      {order.paymentStatus && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                          {paymentStatusLabels[order.paymentStatus]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 客戶資訊 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">客戶資訊</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">客戶名稱</span>
                    <p className="font-medium text-gray-900">{order.userName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email</span>
                    <p className="font-medium text-gray-900">{order.userEmail || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 配送資訊 */}
              {shippingAddr && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">配送資訊</h3>
                  </div>
                  <div className="text-sm space-y-2">
                    {'fullAddress' in shippingAddr ? (
                      <p className="text-gray-900">{shippingAddr.fullAddress}</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-500">收件人</span>
                            <p className="font-medium text-gray-900">{shippingAddr.name || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">電話</span>
                            <p className="font-medium text-gray-900">{shippingAddr.phone || '-'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">地址</span>
                          <p className="font-medium text-gray-900">
                            {[shippingAddr.postalCode, shippingAddr.city, shippingAddr.street]
                              .filter(Boolean)
                              .join(' ') || '-'}
                          </p>
                        </div>
                        {shippingAddr.notes && (
                          <div>
                            <span className="text-gray-500">備註</span>
                            <p className="font-medium text-gray-900">{shippingAddr.notes}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 物流資訊 */}
              {order.trackingNumber && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">物流資訊</h3>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">物流追蹤號</span>
                    <p className="font-medium text-gray-900">{order.trackingNumber}</p>
                  </div>
                </div>
              )}

              {/* 訂單商品 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">訂單商品</h3>
                </div>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center gap-3 bg-white rounded-lg p-3"
                    >
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                          {item.priceUnit && ` ${item.priceUnit}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 金額明細 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">金額明細</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {order.subtotal !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">商品小計</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                  )}
                  {order.shippingFee !== undefined && order.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">運費</span>
                      <span className="text-gray-900">{formatCurrency(order.shippingFee)}</span>
                    </div>
                  )}
                  {order.tax !== undefined && order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">稅金</span>
                      <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  {order.discountAmount !== undefined && order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>折扣 {order.discountCode && `(${order.discountCode})`}</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                    <span className="text-gray-900">總計</span>
                    <span className="text-lg text-green-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* 付款資訊 */}
              {(order.paymentMethod || order.payment) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">付款資訊</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.paymentMethod && (
                      <div>
                        <span className="text-gray-500">付款方式</span>
                        <p className="font-medium text-gray-900">
                          {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                        </p>
                      </div>
                    )}
                    {order.payment?.payTime && (
                      <div>
                        <span className="text-gray-500">付款時間</span>
                        <p className="font-medium text-gray-900">{formatDate(order.payment.payTime)}</p>
                      </div>
                    )}
                    {order.payment?.bankCode && (
                      <div>
                        <span className="text-gray-500">銀行代碼</span>
                        <p className="font-medium text-gray-900">{order.payment.bankCode}</p>
                      </div>
                    )}
                    {order.payment?.vaAccount && (
                      <div>
                        <span className="text-gray-500">虛擬帳號</span>
                        <p className="font-medium text-gray-900">{order.payment.vaAccount}</p>
                      </div>
                    )}
                    {order.payment?.paymentCode && (
                      <div>
                        <span className="text-gray-500">繳費代碼</span>
                        <p className="font-medium text-gray-900">{order.payment.paymentCode}</p>
                      </div>
                    )}
                    {order.payment?.expireDate && (
                      <div>
                        <span className="text-gray-500">繳費期限</span>
                        <p className="font-medium text-gray-900">{formatDate(order.payment.expireDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 訂單備註 */}
              {order.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">訂單備註</h3>
                  </div>
                  <p className="text-sm text-gray-900">{order.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              無法載入訂單資訊
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}
