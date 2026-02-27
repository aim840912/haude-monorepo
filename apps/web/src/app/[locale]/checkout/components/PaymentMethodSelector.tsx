'use client'

import { CreditCard, Building2, Store, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@haude/types'

// 付款方式選項
const paymentMethods: {
  value: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
  enabled: boolean
}[] = [
  { value: 'STORE_CONTACT', label: '電話確認訂單', description: '下單後由店家致電確認，再約定付款方式', icon: Phone, enabled: true },
  { value: 'CREDIT', label: '信用卡', description: '支援 Visa、MasterCard、JCB（即將開放）', icon: CreditCard, enabled: false },
  { value: 'VACC', label: 'ATM 轉帳', description: '取得虛擬帳號後 3 天內轉帳（即將開放）', icon: Building2, enabled: false },
  { value: 'CVS', label: '超商代碼', description: '取得代碼後 7 天內至超商繳費（即將開放）', icon: Store, enabled: false },
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
          const isDisabled = !method.enabled
          return (
            <label
              key={method.value}
              className={cn(
                'flex items-start gap-3 p-4 border rounded-lg transition-colors',
                isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'cursor-pointer',
                !isDisabled && value === method.value
                  ? 'border-green-500 bg-green-50'
                  : !isDisabled && 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={value === method.value}
                onChange={() => !isDisabled && onChange(method.value)}
                disabled={isDisabled}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-5 h-5', isDisabled ? 'text-gray-400' : 'text-gray-600')} />
                  <span className={cn('font-medium', isDisabled ? 'text-gray-400' : 'text-gray-900')}>
                    {method.label}
                  </span>
                </div>
                <p className={cn('text-sm mt-1', isDisabled ? 'text-gray-400' : 'text-gray-500')}>
                  {method.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
