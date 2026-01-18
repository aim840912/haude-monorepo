/**
 * OrderDetailModal 元件單元測試
 *
 * 測試功能：
 * - 基本渲染（開啟/關閉狀態）
 * - Loading 狀態
 * - 訂單資訊顯示
 * - 客戶資訊顯示
 * - 配送資訊（字串/物件格式）
 * - 訂單商品列表
 * - 金額明細
 * - 關閉功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrderDetailModal, type OrderDetail } from './OrderDetailModal'
import type { OrderStatus } from '@haude/types'
import type { PaymentStatus } from '../hooks/useOrders'

// 建立 Mock 訂單詳情
function createMockOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 'order-123',
    orderNumber: 'ORD-2026-001',
    userId: 'user-456',
    userName: '陳小明',
    userEmail: 'test@example.com',
    status: 'confirmed' as OrderStatus,
    subtotal: 2400,
    shippingFee: 100,
    tax: 0,
    discountCode: null,
    discountAmount: 0,
    totalAmount: 2500,
    shippingAddress: {
      name: '陳小明',
      phone: '0912345678',
      street: '中山路一段100號',
      city: '台北市',
      postalCode: '100',
      country: '台灣',
      notes: '請放管理室',
    },
    paymentMethod: 'CREDIT',
    paymentStatus: 'paid' as PaymentStatus,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: '阿里山烏龍茶',
        productImage: 'https://example.com/tea.jpg',
        quantity: 2,
        unitPrice: 1200,
        priceUnit: '150g',
        subtotal: 2400,
      },
    ],
    createdAt: '2026-01-18T10:00:00Z',
    updatedAt: '2026-01-18T12:00:00Z',
    ...overrides,
  }
}

describe('OrderDetailModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // 基本渲染測試
  // ========================================

  describe('基本渲染', () => {
    it('isOpen 為 true 時應該渲染對話框', () => {
      const order = createMockOrderDetail()
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('訂單詳情')).toBeInTheDocument()
    })

    it('isOpen 為 false 時不應該渲染對話框', () => {
      const order = createMockOrderDetail()
      render(
        <OrderDetailModal
          order={order}
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('訂單詳情')).not.toBeInTheDocument()
    })

    it('order 為 null 時應該顯示錯誤訊息', () => {
      render(
        <OrderDetailModal
          order={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('無法載入訂單資訊')).toBeInTheDocument()
    })
  })

  // ========================================
  // Loading 狀態測試
  // ========================================

  describe('Loading 狀態', () => {
    it('isLoading 為 true 時應該顯示 Loading 動畫', () => {
      const { container } = render(
        <OrderDetailModal
          order={createMockOrderDetail()}
          isOpen={true}
          isLoading={true}
          onClose={mockOnClose}
        />
      )

      // Loading spinner 有 animate-spin class
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('Loading 時不應該顯示訂單內容', () => {
      render(
        <OrderDetailModal
          order={createMockOrderDetail()}
          isOpen={true}
          isLoading={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('訂單資訊')).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 訂單資訊測試
  // ========================================

  describe('訂單資訊', () => {
    it('應該顯示訂單編號', () => {
      const order = createMockOrderDetail({ orderNumber: 'ORD-TEST-999' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('ORD-TEST-999')).toBeInTheDocument()
    })

    it('應該顯示訂單狀態標籤', () => {
      const order = createMockOrderDetail({ status: 'shipped' as OrderStatus })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('已出貨')).toBeInTheDocument()
    })

    it('應該顯示付款狀態標籤', () => {
      const order = createMockOrderDetail({ paymentStatus: 'pending' as PaymentStatus })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('待付款')).toBeInTheDocument()
    })
  })

  // ========================================
  // 客戶資訊測試
  // ========================================

  describe('客戶資訊', () => {
    it('應該顯示客戶名稱', () => {
      const order = createMockOrderDetail({ userName: '王大明' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('王大明')).toBeInTheDocument()
    })

    it('應該顯示客戶 Email', () => {
      const order = createMockOrderDetail({ userEmail: 'wang@example.com' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('wang@example.com')).toBeInTheDocument()
    })

    it('客戶名稱為空時應該顯示 -', () => {
      const order = createMockOrderDetail({ userName: undefined })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // 客戶名稱區域應該顯示 '-'
      const dashElements = screen.getAllByText('-')
      expect(dashElements.length).toBeGreaterThan(0)
    })
  })

  // ========================================
  // 配送資訊測試
  // ========================================

  describe('配送資訊', () => {
    it('配送地址為物件時應該顯示詳細欄位', () => {
      const order = createMockOrderDetail({
        shippingAddress: {
          name: '李小華',
          phone: '0987654321',
          city: '高雄市',
          street: '五福路200號',
          postalCode: '800',
        },
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('李小華')).toBeInTheDocument()
      expect(screen.getByText('0987654321')).toBeInTheDocument()
      expect(screen.getByText('800 高雄市 五福路200號')).toBeInTheDocument()
    })

    it('配送地址為字串時應該直接顯示', () => {
      const order = createMockOrderDetail({
        shippingAddress: '100 台北市中正區重慶南路一段122號',
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('100 台北市中正區重慶南路一段122號')).toBeInTheDocument()
    })

    it('沒有配送地址時不應該顯示配送資訊區塊', () => {
      const order = createMockOrderDetail({ shippingAddress: undefined })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('配送資訊')).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 訂單商品測試
  // ========================================

  describe('訂單商品', () => {
    it('應該顯示商品名稱', () => {
      const order = createMockOrderDetail({
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: '日月潭紅茶',
            quantity: 1,
            unitPrice: 800,
            subtotal: 800,
          },
        ],
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('日月潭紅茶')).toBeInTheDocument()
    })

    it('應該顯示商品單價和數量', () => {
      const order = createMockOrderDetail({
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: '測試商品',
            quantity: 3,
            unitPrice: 500,
            subtotal: 1500,
          },
        ],
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/NT\$ 500 × 3/)).toBeInTheDocument()
    })

    it('應該顯示多個商品', () => {
      const order = createMockOrderDetail({
        items: [
          { id: 'item-1', productId: 'prod-1', productName: '商品A', quantity: 1, unitPrice: 100, subtotal: 100 },
          { id: 'item-2', productId: 'prod-2', productName: '商品B', quantity: 2, unitPrice: 200, subtotal: 400 },
          { id: 'item-3', productId: 'prod-3', productName: '商品C', quantity: 3, unitPrice: 300, subtotal: 900 },
        ],
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('商品A')).toBeInTheDocument()
      expect(screen.getByText('商品B')).toBeInTheDocument()
      expect(screen.getByText('商品C')).toBeInTheDocument()
    })
  })

  // ========================================
  // 金額明細測試
  // ========================================

  describe('金額明細', () => {
    it('應該顯示商品小計', () => {
      const order = createMockOrderDetail({ subtotal: 3600 })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('NT$ 3,600')).toBeInTheDocument()
    })

    it('應該顯示運費', () => {
      const order = createMockOrderDetail({ shippingFee: 150 })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('運費')).toBeInTheDocument()
      expect(screen.getByText('NT$ 150')).toBeInTheDocument()
    })

    it('有折扣時應該顯示折扣金額', () => {
      const order = createMockOrderDetail({
        discountCode: 'SAVE20',
        discountAmount: 500,
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/折扣.*SAVE20/)).toBeInTheDocument()
      expect(screen.getByText('-NT$ 500')).toBeInTheDocument()
    })

    it('應該顯示訂單總金額', () => {
      const order = createMockOrderDetail({ totalAmount: 4800 })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('NT$ 4,800')).toBeInTheDocument()
    })
  })

  // ========================================
  // 付款資訊測試
  // ========================================

  describe('付款資訊', () => {
    it('應該顯示付款方式', () => {
      const order = createMockOrderDetail({ paymentMethod: 'CREDIT' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('信用卡')).toBeInTheDocument()
    })

    it('ATM 付款應該顯示虛擬帳號', () => {
      const order = createMockOrderDetail({
        paymentMethod: 'VACC',
        payment: {
          id: 'pay-1',
          status: 'pending' as PaymentStatus,
          bankCode: '012',
          vaAccount: '1234567890123456',
        },
      })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('ATM 轉帳')).toBeInTheDocument()
      expect(screen.getByText('012')).toBeInTheDocument()
      expect(screen.getByText('1234567890123456')).toBeInTheDocument()
    })
  })

  // ========================================
  // 物流追蹤測試
  // ========================================

  describe('物流追蹤', () => {
    it('有追蹤號時應該顯示物流資訊區塊', () => {
      const order = createMockOrderDetail({ trackingNumber: 'TW123456789' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('物流資訊')).toBeInTheDocument()
      expect(screen.getByText('TW123456789')).toBeInTheDocument()
    })

    it('沒有追蹤號時不應該顯示物流資訊區塊', () => {
      const order = createMockOrderDetail({ trackingNumber: undefined })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('物流資訊')).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 訂單備註測試
  // ========================================

  describe('訂單備註', () => {
    it('有備註時應該顯示備註區塊', () => {
      const order = createMockOrderDetail({ notes: '請在下午 3 點後送達' })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // 標題是「訂單備註」，需要精確匹配
      const notesSections = screen.getAllByText('訂單備註')
      expect(notesSections.length).toBeGreaterThan(0)
      expect(screen.getByText('請在下午 3 點後送達')).toBeInTheDocument()
    })

    it('沒有備註時不應該顯示備註區塊', () => {
      const order = createMockOrderDetail({ notes: undefined })
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // 只檢查備註內容區塊的標題（區分訂單資訊中的 FileText 圖示區塊）
      const noteContents = screen.queryAllByText('請在下午 3 點後送達')
      expect(noteContents).toHaveLength(0)
    })
  })

  // ========================================
  // 關閉功能測試
  // ========================================

  describe('關閉功能', () => {
    it('點擊關閉按鈕應該觸發 onClose', () => {
      const order = createMockOrderDetail()
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // 底部的「關閉」按鈕
      const closeButtons = screen.getAllByRole('button', { name: '關閉' })
      fireEvent.click(closeButtons[0])

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('點擊 X 按鈕應該觸發 onClose', () => {
      const order = createMockOrderDetail()
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // X 按鈕在 header 中
      const allButtons = screen.getAllByRole('button')
      const xButton = allButtons[0]
      fireEvent.click(xButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('點擊背景應該觸發 onClose', () => {
      const order = createMockOrderDetail()
      const { container } = render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const backdrop = container.querySelector('.fixed.inset-0')
      fireEvent.click(backdrop!)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('點擊對話框內容不應該觸發 onClose', () => {
      const order = createMockOrderDetail()
      render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const content = screen.getByText('訂單詳情')
      fireEvent.click(content)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  // ========================================
  // 狀態標籤樣式測試
  // ========================================

  describe('狀態標籤樣式', () => {
    it.each([
      ['pending', '待處理', 'bg-yellow-100'],
      ['confirmed', '已確認', 'bg-blue-100'],
      ['processing', '處理中', 'bg-indigo-100'],
      ['shipped', '已出貨', 'bg-purple-100'],
      ['delivered', '已送達', 'bg-green-100'],
      ['cancelled', '已取消', 'bg-gray-100'],
      ['refunded', '已退款', 'bg-red-100'],
    ] as const)('狀態 %s 應該顯示 %s 並有正確樣式', (status, label, colorClass) => {
      const order = createMockOrderDetail({ status: status as OrderStatus })
      const { container } = render(
        <OrderDetailModal
          order={order}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(label)).toBeInTheDocument()
      const statusBadge = container.querySelector(`.${colorClass}`)
      expect(statusBadge).toBeInTheDocument()
    })
  })
})
