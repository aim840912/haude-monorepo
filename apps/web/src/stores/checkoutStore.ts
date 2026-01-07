import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaymentMethod, ShippingAddress } from '@/types/order'

/**
 * 結帳表單持久化 Store
 *
 * 功能：
 * - 自動保存收件人資訊到 localStorage
 * - 下次結帳時自動填入上次的資料
 * - 保存用戶偏好的付款方式
 *
 * 不保存的欄位：
 * - orderNotes（訂單備註）：每次訂單可能不同
 */

interface CheckoutFormState {
  // 收件人資訊
  shippingAddress: ShippingAddress

  // 付款方式
  paymentMethod: PaymentMethod

  // Actions
  setShippingAddress: (address: Partial<ShippingAddress>) => void
  setPaymentMethod: (method: PaymentMethod) => void
  clearForm: () => void
}

// 預設收件人資訊
const defaultShippingAddress: ShippingAddress = {
  name: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: '台灣',
  notes: '',
}

// 預設付款方式
const defaultPaymentMethod: PaymentMethod = 'CREDIT'

export const useCheckoutStore = create<CheckoutFormState>()(
  persist(
    (set) => ({
      shippingAddress: defaultShippingAddress,
      paymentMethod: defaultPaymentMethod,

      /**
       * 更新收件人資訊（支援部分更新）
       */
      setShippingAddress: (address) =>
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...address },
        })),

      /**
       * 更新付款方式
       */
      setPaymentMethod: (method) =>
        set({ paymentMethod: method }),

      /**
       * 清除表單（重設為預設值）
       */
      clearForm: () =>
        set({
          shippingAddress: defaultShippingAddress,
          paymentMethod: defaultPaymentMethod,
        }),
    }),
    {
      name: 'checkout-form-storage',
      // 只持久化這些欄位
      partialize: (state) => ({
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
)
