'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SafeImage } from '@/components/ui/SafeImage'
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@haude/types'

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

/**
 * 訂單列表頁
 *
 * 功能：
 * - 顯示用戶所有訂單
 * - 訂單狀態標籤
 * - 點擊查看詳情
 */
export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  )
}

function OrdersContent() {
  const { orders, isLoading, error, hasMore, loadMore } = useOrders()

  // 載入狀態
  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">我的訂單</h1>
          <p className="text-gray-600 mt-1">查看您的訂單記錄和狀態</p>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">載入失敗</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">目前沒有訂單</h3>
            <p className="text-gray-600 mb-6">快去選購喜歡的商品吧！</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              瀏覽產品
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status]
              const StatusIcon = status.icon

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* 訂單頭部 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">訂單編號</span>
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                          status.color
                        )}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span>{status.label}</span>
                      </div>
                    </div>

                    {/* 訂單商品 */}
                    <div className="space-y-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          {item.productImage ? (
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <SafeImage
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                sizes="64px"
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{item.productName}</h4>
                            <p className="text-sm text-gray-500">
                              NT$ {item.unitPrice.toLocaleString()} x {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              NT$ {item.subtotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          還有 {order.items.length - 3} 件商品...
                        </p>
                      )}
                    </div>

                    {/* 訂單底部 */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('zh-TW', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-900">
                          NT$ {order.totalAmount.toLocaleString()}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* 載入更多 */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '載入中...' : '載入更多'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
