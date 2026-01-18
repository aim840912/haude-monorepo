/**
 * 結帳 Store 單元測試
 *
 * 測試功能：
 * - 收件人資訊管理
 * - 付款方式管理
 * - 折扣碼管理
 * - 表單持久化
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useCheckoutStore } from './checkoutStore'
import type { DiscountValidation } from '@/types/order'

describe('checkoutStore', () => {
  beforeEach(() => {
    // Reset store state
    useCheckoutStore.setState({
      shippingAddress: {
        name: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: '台灣',
        notes: '',
      },
      paymentMethod: 'CREDIT',
      discountCode: '',
      discountInfo: null,
      isValidatingDiscount: false,
    })

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // 收件人資訊
  // ========================================

  describe('收件人資訊管理', () => {
    it('應該設定完整的收件人資訊', () => {
      act(() => {
        useCheckoutStore.getState().setShippingAddress({
          name: '張三',
          phone: '0912345678',
          street: '忠孝東路一段 100 號',
          city: '台北市',
          postalCode: '100',
        })
      })

      const state = useCheckoutStore.getState()
      expect(state.shippingAddress.name).toBe('張三')
      expect(state.shippingAddress.phone).toBe('0912345678')
      expect(state.shippingAddress.city).toBe('台北市')
    })

    it('應該支援部分更新', () => {
      // 先設定部分資訊
      act(() => {
        useCheckoutStore.getState().setShippingAddress({ name: '張三' })
      })

      // 再更新其他欄位
      act(() => {
        useCheckoutStore.getState().setShippingAddress({ phone: '0912345678' })
      })

      const state = useCheckoutStore.getState()
      expect(state.shippingAddress.name).toBe('張三')
      expect(state.shippingAddress.phone).toBe('0912345678')
    })

    it('應該保留預設的國家', () => {
      act(() => {
        useCheckoutStore.getState().setShippingAddress({ name: '張三' })
      })

      expect(useCheckoutStore.getState().shippingAddress.country).toBe('台灣')
    })

    it('應該允許設定備註', () => {
      act(() => {
        useCheckoutStore.getState().setShippingAddress({
          notes: '請放在門口',
        })
      })

      expect(useCheckoutStore.getState().shippingAddress.notes).toBe('請放在門口')
    })
  })

  // ========================================
  // 付款方式
  // ========================================

  describe('付款方式管理', () => {
    it('預設應該是信用卡', () => {
      expect(useCheckoutStore.getState().paymentMethod).toBe('CREDIT')
    })

    it('應該設定為銀行虛擬帳號', () => {
      act(() => {
        useCheckoutStore.getState().setPaymentMethod('VACC')
      })

      expect(useCheckoutStore.getState().paymentMethod).toBe('VACC')
    })

    it('應該設定為超商代碼', () => {
      act(() => {
        useCheckoutStore.getState().setPaymentMethod('CVS')
      })

      expect(useCheckoutStore.getState().paymentMethod).toBe('CVS')
    })

    it('應該設定為網路 ATM', () => {
      act(() => {
        useCheckoutStore.getState().setPaymentMethod('WEBATM')
      })

      expect(useCheckoutStore.getState().paymentMethod).toBe('WEBATM')
    })
  })

  // ========================================
  // 折扣碼管理
  // ========================================

  describe('折扣碼管理', () => {
    it('應該設定折扣碼', () => {
      act(() => {
        useCheckoutStore.getState().setDiscountCode('SAVE10')
      })

      expect(useCheckoutStore.getState().discountCode).toBe('SAVE10')
    })

    it('應該設定折扣驗證結果', () => {
      const discountInfo: DiscountValidation = {
        valid: true,
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        message: '折扣碼有效',
      }

      act(() => {
        useCheckoutStore.getState().setDiscountInfo(discountInfo)
      })

      const state = useCheckoutStore.getState()
      expect(state.discountInfo?.valid).toBe(true)
      expect(state.discountInfo?.discountAmount).toBe(100)
    })

    it('應該設定驗證中狀態', () => {
      act(() => {
        useCheckoutStore.getState().setIsValidatingDiscount(true)
      })

      expect(useCheckoutStore.getState().isValidatingDiscount).toBe(true)
    })

    it('應該清除折扣碼', () => {
      // 先設定折扣碼
      act(() => {
        useCheckoutStore.getState().setDiscountCode('SAVE10')
        useCheckoutStore.getState().setDiscountInfo({
          valid: true,
          code: 'SAVE10',
          discountType: 'FIXED',
          discountValue: 100,
          discountAmount: 100,
        })
        useCheckoutStore.getState().setIsValidatingDiscount(true)
      })

      // 清除折扣碼
      act(() => {
        useCheckoutStore.getState().clearDiscount()
      })

      const state = useCheckoutStore.getState()
      expect(state.discountCode).toBe('')
      expect(state.discountInfo).toBeNull()
      expect(state.isValidatingDiscount).toBe(false)
    })
  })

  // ========================================
  // 表單清除
  // ========================================

  describe('表單清除', () => {
    it('應該重設所有欄位為預設值', () => {
      // 先填寫表單
      act(() => {
        useCheckoutStore.getState().setShippingAddress({
          name: '張三',
          phone: '0912345678',
        })
        useCheckoutStore.getState().setPaymentMethod('VACC')
        useCheckoutStore.getState().setDiscountCode('SAVE10')
      })

      // 清除表單
      act(() => {
        useCheckoutStore.getState().clearForm()
      })

      const state = useCheckoutStore.getState()
      expect(state.shippingAddress.name).toBe('')
      expect(state.shippingAddress.phone).toBe('')
      expect(state.paymentMethod).toBe('CREDIT')
      expect(state.discountCode).toBe('')
      expect(state.discountInfo).toBeNull()
    })
  })

  // ========================================
  // 邊界情況
  // ========================================

  describe('邊界情況', () => {
    it('應該處理空字串收件人名稱', () => {
      act(() => {
        useCheckoutStore.getState().setShippingAddress({ name: '' })
      })

      expect(useCheckoutStore.getState().shippingAddress.name).toBe('')
    })

    it('應該處理無效折扣驗證結果', () => {
      const invalidDiscount: DiscountValidation = {
        valid: false,
        code: 'INVALID',
        message: '折扣碼已過期',
      }

      act(() => {
        useCheckoutStore.getState().setDiscountInfo(invalidDiscount)
      })

      expect(useCheckoutStore.getState().discountInfo?.valid).toBe(false)
      expect(useCheckoutStore.getState().discountInfo?.message).toBe('折扣碼已過期')
    })

    it('應該處理 null 折扣驗證結果', () => {
      act(() => {
        useCheckoutStore.getState().setDiscountInfo(null)
      })

      expect(useCheckoutStore.getState().discountInfo).toBeNull()
    })
  })
})
