'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  MapPin,
  Phone,
  User,
  CreditCard,
} from 'lucide-react'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { useToast } from '@/components/ui/feedback/toast'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { PaymentButton, PaymentStatusBadge } from '@/components/features/payment'
import { cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus } from '@/types/order'

// 訂單狀態配置
const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: '已確認', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: '處理中', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: '已出貨', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: '已送達', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-800', icon: XCircle },
}

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 訂單詳情頁
 *
 * 功能：
 * - 顯示完整訂單資訊
 * - 付款按鈕（待付款時）
 * - 取消訂單功能
 */
export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { error: showError } = useToast()
  const { order, isLoading, error, refetch } = useOrder(id)
  const { cancelOrder, isCancelling } = useCancelOrder()
  const [cancelError, setCancelError] = useState<string | null>(null)

  // 載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 錯誤狀態
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">載入失敗</h3>
            <p className="text-red-600">{error || '找不到該訂單'}</p>
            <Link
              href="/orders"
              className="inline-block mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              返回訂單列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  // 判斷是否可以付款
  const canPay = order.status === 'pending' && order.paymentStatus !== 'paid'

  // 判斷是否可以取消
  const canCancel = ['pending', 'confirmed'].includes(order.status)

  // 處理取消訂單
  const handleCancel = async () => {
    if (!confirm('確定要取消此訂單嗎？')) return

    setCancelError(null)
    const success = await cancelOrder(order.id)
    if (success) {
      refetch()
    } else {
      setCancelError('取消訂單失敗，請稍後再試')
    }
  }

  // 處理付款錯誤
  const handlePaymentError = (errorMsg: string) => {
    showError('付款失敗', errorMsg)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回訂單列表</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">訂單詳情</h1>
              <p className="text-gray-600 mt-1">訂單編號：{order.orderNumber}</p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium w-fit',
                status.color
              )}
            >
              <StatusIcon className="w-4 h-4" />
              <span>{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 付款區塊 */}
        {canPay && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">付款資訊</h2>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600">付款狀態</p>
                <PaymentStatusBadge
                  status={(order.paymentStatus as PaymentStatus) || 'pending'}
                  className="mt-1"
                />
              </div>
              <div className="text-right">
                <p className="text-gray-600">應付金額</p>
                <p className="text-2xl font-bold text-green-900">
                  NT$ {order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* ATM 虛擬帳號資訊 */}
            {order.payment?.paymentType === 'ATM' && order.payment?.bankCode && order.payment?.vaAccount && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">ATM 轉帳資訊</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">銀行代碼：</span><span className="font-mono font-medium">{order.payment.bankCode}</span></p>
                  <p><span className="text-gray-600">虛擬帳號：</span><span className="font-mono font-medium">{order.payment.vaAccount}</span></p>
                  {order.payment.expireDate && (
                    <p><span className="text-gray-600">繳費期限：</span>{new Date(order.payment.expireDate).toLocaleString('zh-TW')}</p>
                  )}
                </div>
              </div>
            )}

            {/* CVS 超商繳費資訊 */}
            {order.payment?.paymentType === 'CVS' && order.payment?.paymentCode && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-2">超商繳費資訊</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">繳費代碼：</span><span className="font-mono font-medium">{order.payment.paymentCode}</span></p>
                  {order.payment.expireDate && (
                    <p><span className="text-gray-600">繳費期限：</span>{new Date(order.payment.expireDate).toLocaleString('zh-TW')}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">請至 7-11、全家、萊爾富、OK 超商繳費</p>
              </div>
            )}

            <PaymentButton
              orderId={order.id}
              paymentMethod={order.paymentMethod || undefined}
              onError={handlePaymentError}
              className="w-full sm:w-auto sm:min-w-[200px] sm:ml-auto sm:block"
            />
          </div>
        )}

        {/* 已付款提示 */}
        {order.paymentStatus === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">付款已完成</p>
              {order.paymentTime && (
                <p className="text-sm text-green-600">
                  付款時間：{new Date(order.paymentTime).toLocaleString('zh-TW')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 訂單商品 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">訂單商品</h2>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    NT$ {item.unitPrice.toLocaleString()}
                    {item.priceUnit && ` / ${item.priceUnit}`}
                    {' x '}
                    {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    NT$ {item.subtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 金額摘要 */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>小計</span>
              <span>NT$ {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>運費</span>
              <span>NT$ {order.shippingFee.toLocaleString()}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>稅金</span>
                <span>NT$ {order.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>總計</span>
              <span className="text-green-900">
                NT$ {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 收件資訊 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">收件資訊</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{order.shippingAddress.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{order.shippingAddress.phone}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-gray-900">
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.street}</p>
              </div>
            </div>
            {order.shippingAddress.notes && (
              <div className="text-gray-600 text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                備註：{order.shippingAddress.notes}
              </div>
            )}
          </div>
        </div>

        {/* 訂單資訊 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">訂單資訊</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">建立時間</p>
              <p className="text-gray-900">
                {new Date(order.createdAt).toLocaleString('zh-TW')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">更新時間</p>
              <p className="text-gray-900">
                {new Date(order.updatedAt).toLocaleString('zh-TW')}
              </p>
            </div>
            {order.trackingNumber && (
              <div>
                <p className="text-gray-500">物流單號</p>
                <p className="text-gray-900">{order.trackingNumber}</p>
              </div>
            )}
            {order.estimatedDeliveryDate && (
              <div>
                <p className="text-gray-500">預計送達</p>
                <p className="text-gray-900">
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString('zh-TW')}
                </p>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm mb-1">訂單備註</p>
              <p className="text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>

        {/* 取消訂單 */}
        {canCancel && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">其他操作</h2>

            {cancelError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {cancelError}
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isCancelling ? '取消中...' : '取消訂單'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
