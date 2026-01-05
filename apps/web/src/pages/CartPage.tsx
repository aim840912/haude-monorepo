import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCartStore, useTotalItems, useTotalPrice } from '@/stores/cartStore'
import { PageHeader } from '@/components/ui/sections'
import { cn } from '@/lib/utils'

/**
 * 購物車頁面
 *
 * 功能：
 * - 顯示購物車內容
 * - 修改數量、刪除商品
 * - 結帳流程入口
 */
export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const totalItems = useTotalItems()
  const totalPrice = useTotalPrice()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="購物車" subtitle="查看您的購物清單" />

        {/* 空購物車 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">購物車是空的</h2>
            <p className="text-gray-500 mb-8">快去挑選喜歡的商品吧！</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              瀏覽產品
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="購物車" subtitle={`共 ${totalItems} 件商品`} />

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 購物車項目列表 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                {/* 商品圖片 */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    NT$ {item.price.toLocaleString()}
                  </p>

                  {/* 數量控制 */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className={cn(
                        'p-1 rounded border',
                        item.quantity <= 1
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 rounded border border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 小計和刪除 */}
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="mt-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* 清空購物車 */}
            <div className="text-right">
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                清空購物車
              </button>
            </div>
          </div>

          {/* 訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <h2 className="text-lg font-medium text-gray-900 mb-4">訂單摘要</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>小計 ({totalItems} 件)</span>
                  <span>NT$ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>運費</span>
                  <span className="text-green-600">免運費</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-medium text-lg">
                  <span>總計</span>
                  <span className="text-green-600">NT$ {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
              >
                前往結帳
              </Link>

              <Link
                to="/products"
                className="block text-center mt-4 text-sm text-green-600 hover:underline"
              >
                繼續購物
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
