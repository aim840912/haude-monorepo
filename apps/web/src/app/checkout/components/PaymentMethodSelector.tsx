'use client'

import { CreditCard, Building2, Store, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types/order'

// 付款方式選項
const paymentMethods: {
  value: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}[] = [
  { value: 'CREDIT', label: '信用卡', description: '支援 Visa、MasterCard、JCB', icon: CreditCard },
  { value: 'VACC', label: 'ATM 轉帳', description: '取得虛擬帳號後轉帳', icon: Building2 },
  { value: 'CVS', label: '超商代碼', description: '7-11、全家、萊爾富、OK', icon: Store },
  { value: 'WEBATM', label: 'WebATM', description: '需讀卡機，即時轉帳', icon: Globe },
]

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

/**
 * 付款方式選擇元件
 */
export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
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
                value === method.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={value === method.value}
                onChange={() => onChange(method.value)}
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
  )
}
