'use client'

import { cn } from '@/lib/utils'
import type { ShippingAddress } from '@haude/types'
import type { CheckoutFormErrors } from '../hooks/useCheckoutForm'

// 台灣縣市
const taiwanCities = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

interface ShippingAddressFormProps {
  shippingAddress: ShippingAddress
  errors: CheckoutFormErrors
  onAddressChange: (field: keyof ShippingAddress, value: string) => void
}

/**
 * 收件人資訊表單元件
 */
export function ShippingAddressForm({
  shippingAddress,
  errors,
  onAddressChange,
}: ShippingAddressFormProps) {
  return (
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
            onChange={(e) => onAddressChange('name', e.target.value)}
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
            onChange={(e) => onAddressChange('phone', e.target.value)}
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
            onChange={(e) => onAddressChange('city', e.target.value)}
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
            onChange={(e) => onAddressChange('postalCode', e.target.value)}
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
            onChange={(e) => onAddressChange('street', e.target.value)}
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
            onChange={(e) => onAddressChange('notes', e.target.value)}
            placeholder="例：大樓管理員代收、請放門口"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  )
}
