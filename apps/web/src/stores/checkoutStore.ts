import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaymentMethod, ShippingAddress, DiscountValidation } from '@haude/types'

/**
 * 結帳表單持久化 Store
 *
 * 功能：
 * - 自動保存收件人資訊到 localStorage
 * - 下次結帳時自動填入上次的資料
 * - 保存用戶偏好的付款方式
 * - 管理折扣碼狀態
 *
 * 不保存的欄位：
 * - orderNotes（訂單備註）：每次訂單可能不同
 * - discountCode 和 discountInfo：每次訂單需重新驗證
 */

interface CheckoutFormState {
  // 收件人資訊
  shippingAddress: ShippingAddress

  // 付款方式
  paymentMethod: PaymentMethod

  // 折扣碼
  discountCode: string
  discountInfo: DiscountValidation | null
  isValidatingDiscount: boolean

  // Actions
  setShippingAddress: (address: Partial<ShippingAddress>) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setDiscountCode: (code: string) => void
  setDiscountInfo: (info: DiscountValidation | null) => void
  setIsValidatingDiscount: (isValidating: boolean) => void
  clearDiscount: () => void
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
const defaultPaymentMethod: PaymentMethod = 'STORE_CONTACT'

export const useCheckoutStore = create<CheckoutFormState>()(
  persist(
    (set) => ({
      shippingAddress: defaultShippingAddress,
      paymentMethod: defaultPaymentMethod,
      discountCode: '',
      discountInfo: null,
      isValidatingDiscount: false,

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
       * 設定折扣碼
       */
      setDiscountCode: (code) =>
        set({ discountCode: code }),

      /**
       * 設定折扣驗證結果
       */
      setDiscountInfo: (info) =>
        set({ discountInfo: info }),

      /**
       * 設定是否正在驗證折扣碼
       */
      setIsValidatingDiscount: (isValidating) =>
        set({ isValidatingDiscount: isValidating }),

      /**
       * 清除折扣碼
       */
      clearDiscount: () =>
        set({
          discountCode: '',
          discountInfo: null,
          isValidatingDiscount: false,
        }),

      /**
       * 清除表單（重設為預設值）
       */
      clearForm: () =>
        set({
          shippingAddress: defaultShippingAddress,
          paymentMethod: defaultPaymentMethod,
          discountCode: '',
          discountInfo: null,
          isValidatingDiscount: false,
        }),
    }),
    {
      name: 'checkout-form-storage',
      // 只持久化這些欄位（不包含折扣碼）
      partialize: (state) => ({
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
)
