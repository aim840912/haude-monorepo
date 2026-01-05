import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Building2, Store, Globe, Loader2, ShoppingBag } from 'lucide-react'
import { useCartStore, useTotalItems, useTotalPrice } from '@/stores/cartStore'
import { ordersApi } from '@/services/api'
import { cn } from '@/lib/utils'
import type { PaymentMethod, ShippingAddress } from '@/types/order'

// 付款方式選項
const paymentMethods: { value: PaymentMethod; label: string; description: string; icon: typeof CreditCard }[] = [
  { value: 'CREDIT', label: '信用卡', description: '支援 Visa、MasterCard、JCB', icon: CreditCard },
  { value: 'VACC', label: 'ATM 轉帳', description: '取得虛擬帳號後轉帳', icon: Building2 },
  { value: 'CVS', label: '超商代碼', description: '7-11、全家、萊爾富、OK', icon: Store },
  { value: 'WEBATM', label: 'WebATM', description: '需讀卡機，即時轉帳', icon: Globe },
]

// 台灣縣市
const taiwanCities = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

/**
 * 結帳頁面
 *
 * 功能：
 * - 顯示購物車摘要
 * - 填寫收件人資訊
 * - 選擇付款方式
 * - 建立訂單
 */
export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const totalItems = useTotalItems()
  const totalPrice = useTotalPrice()

  // 表單狀態
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: '台灣',
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({})

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {}

    if (!shippingAddress.name.trim()) {
      newErrors.name = '請輸入收件人姓名'
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話'
    } else if (!/^09\d{8}$/.test(shippingAddress.phone.replace(/-/g, ''))) {
      newErrors.phone = '請輸入有效的手機號碼（09 開頭）'
    }
    if (!shippingAddress.city) {
      newErrors.city = '請選擇縣市'
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = '請輸入郵遞區號'
    } else if (!/^\d{3,5}$/.test(shippingAddress.postalCode)) {
      newErrors.postalCode = '請輸入有效的郵遞區號'
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = '請輸入詳細地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 處理欄位變更
  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // 提交訂單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (items.length === 0) {
      alert('購物車是空的')
      return
    }

    setIsSubmitting(true)

    try {
      // 建立訂單
      const { data } = await ordersApi.create({
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        notes: orderNotes || undefined,
      })

      // 清空購物車
      await clearCart()

      // 跳轉到訂單詳情頁（可進行付款）
      navigate(`/orders/${data.id}`, {
        state: { fromCheckout: true },
      })
    } catch (error) {
      console.error('建立訂單失敗:', error)
      alert('建立訂單失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 購物車為空
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">購物車是空的</h2>
        <p className="text-gray-500 mb-6">請先將商品加入購物車</p>
        <Link
          to="/products"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          瀏覽產品
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <div className="bg-white border-b sticky top-[var(--header-height)] z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回購物車</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-lg font-medium text-gray-900">結帳</h1>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左側：表單區 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 收件人資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">收件人資訊</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* 姓名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收件人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.name}
                      onChange={(e) => handleAddressChange('name', e.target.value)}
                      placeholder="請輸入真實姓名"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500',
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      )}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* 電話 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      聯絡電話 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="0912-345-678"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500',
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      )}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  {/* 縣市 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      縣市 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white',
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      )}
                    >
                      <option value="">請選擇縣市</option>
                      {taiwanCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                  </div>

                  {/* 郵遞區號 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      郵遞區號 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      placeholder="例：100"
                      maxLength={5}
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500',
                        errors.postalCode ? 'border-red-500' : 'border-gray-300'
                      )}
                    />
                    {errors.postalCode && <p className="mt-1 text-sm text-red-500">{errors.postalCode}</p>}
                  </div>

                  {/* 詳細地址 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      詳細地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="路名、巷弄、樓層、門牌號碼"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500',
                        errors.street ? 'border-red-500' : 'border-gray-300'
                      )}
                    />
                    {errors.street && <p className="mt-1 text-sm text-red-500">{errors.street}</p>}
                  </div>

                  {/* 配送備註 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      配送備註（選填）
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.notes || ''}
                      onChange={(e) => handleAddressChange('notes', e.target.value)}
                      placeholder="例：大樓管理員代收、請放門口"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* 付款方式 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">付款方式</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {paymentMethods.map(method => {
                    const Icon = method.icon
                    return (
                      <label
                        key={method.value}
                        className={cn(
                          'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                          paymentMethod === method.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">{method.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 訂單備註 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">訂單備註（選填）</h2>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="有什麼需要告訴我們的嗎？"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            {/* 右側：訂單摘要 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[calc(var(--header-height)+5rem)]">
                <h2 className="text-lg font-medium text-gray-900 mb-4">訂單摘要</h2>

                {/* 商品列表 */}
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          NT$ {item.price.toLocaleString()} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        NT$ {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 金額計算 */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>小計（{totalItems} 件）</span>
                    <span>NT$ {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>運費</span>
                    <span className="text-green-600">免運費</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium text-lg">
                    <span>總計</span>
                    <span className="text-green-600">NT$ {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* 提交按鈕 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full mt-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                    isSubmitting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    '確認訂單'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  點擊「確認訂單」即表示您同意我們的服務條款和隱私政策
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
