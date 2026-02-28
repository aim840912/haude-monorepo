'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore, useTotalItems, useTotalPrice, type CartItem } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useToast } from '@/components/ui/feedback/toast'
import { ordersApi } from '@/services/api'
import type { PaymentMethod, ShippingAddress } from '@haude/types'
import logger from '@/lib/logger'

/**
 * 結帳表單驗證錯誤
 */
export type CheckoutFormErrors = Partial<Record<keyof ShippingAddress, string>>

/**
 * useCheckoutForm 回傳的型別
 */
export interface UseCheckoutFormReturn {
  // 狀態
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  orderNotes: string
  errors: CheckoutFormErrors
  isSubmitting: boolean
  isHydrated: boolean

  // 購物車資料
  items: CartItem[]
  totalItems: number
  totalPrice: number

  // 處理函式
  handleAddressChange: (field: keyof ShippingAddress, value: string) => void
  handlePaymentMethodChange: (method: PaymentMethod) => void
  setOrderNotes: (notes: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

/**
 * 結帳表單 Hook
 *
 * 功能：
 * - 管理結帳表單狀態
 * - 處理表單驗證
 * - 整合持久化 store
 * - 處理訂單提交
 */
export function useCheckoutForm(): UseCheckoutFormReturn {
  const router = useRouter()
  const { warning, error: showError } = useToast()
  const { items, clearCart } = useCartStore()
  const totalItems = useTotalItems()
  const totalPrice = useTotalPrice()

  // 從 store 獲取持久化的表單數據
  const {
    shippingAddress: savedAddress,
    paymentMethod: savedPaymentMethod,
    setShippingAddress: saveAddress,
    setPaymentMethod: savePaymentMethod,
    discountCode,
    clearDiscount,
  } = useCheckoutStore()

  // 表單狀態（本地狀態用於即時回應）
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: '台灣',
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STORE_CONTACT')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<CheckoutFormErrors>({})
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration: 客戶端載入後從 store 讀取已保存的數據
  useEffect(() => {
    setShippingAddress(savedAddress)
    setPaymentMethod(savedPaymentMethod)
    setIsHydrated(true)
  }, [savedAddress, savedPaymentMethod])

  // 驗證表單
  const validateForm = useCallback((): boolean => {
    const newErrors: CheckoutFormErrors = {}

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
  }, [shippingAddress])

  // 處理地址欄位變更
  const handleAddressChange = useCallback(
    (field: keyof ShippingAddress, value: string) => {
      // 更新本地狀態（即時回應）
      setShippingAddress(prev => ({ ...prev, [field]: value }))
      // 同步保存到 store（持久化）
      saveAddress({ [field]: value })
      // 清除該欄位的錯誤
      setErrors(prev => ({ ...prev, [field]: undefined }))
    },
    [saveAddress]
  )

  // 處理付款方式變更
  const handlePaymentMethodChange = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method)
      savePaymentMethod(method)
    },
    [savePaymentMethod]
  )

  // 提交訂單
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      if (items.length === 0) {
        warning('購物車是空的', '請先將商品加入購物車')
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
          discountCode: discountCode || undefined,
        })

        // 清空購物車和折扣碼
        await clearCart()
        clearDiscount()

        // 跳轉到訂單詳情頁（可進行付款）
        router.push(`/orders/${data.id}`)
      } catch (error) {
        logger.error('建立訂單失敗', { error })
        showError('建立訂單失敗', '請稍後再試')
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateForm, items, shippingAddress, paymentMethod, orderNotes, discountCode, clearCart, clearDiscount, router, warning, showError]
  )

  return {
    // 狀態
    shippingAddress,
    paymentMethod,
    orderNotes,
    errors,
    isSubmitting,
    isHydrated,

    // 購物車資料
    items,
    totalItems,
    totalPrice,

    // 處理函式
    handleAddressChange,
    handlePaymentMethodChange,
    setOrderNotes,
    handleSubmit,
  }
}
