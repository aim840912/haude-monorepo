/**
 * OrderStatusModal 元件單元測試
 *
 * 只列出 API 接受的狀態轉換（ORDER_STATUS_TRANSITIONS），
 * 避免管理員選了一個送出後才被 API 拒絕的狀態。
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OrderStatus } from '@haude/types'
import { OrderStatusModal } from './OrderStatusModal'
import type { Order } from '../hooks/useOrders'

function renderWithStatus(status: OrderStatus) {
  const order = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    userId: 'user-1',
    items: [],
    totalAmount: 1200,
    status,
    paymentStatus: 'pending',
    createdAt: '2026-11-11T00:00:00.000Z',
  } as unknown as Order

  render(
    <OrderStatusModal
      order={order}
      isOpen
      isUpdating={false}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  )
}

const statusRadioValues = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[name="status"]')).map(
    (input) => input.value,
  )

describe('OrderStatusModal', () => {
  it('待處理的訂單可以往後推進或取消，不會出現已退款', () => {
    renderWithStatus('pending')

    expect(statusRadioValues()).toEqual([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ])
  })

  it('處理中的訂單不能取消', () => {
    renderWithStatus('processing')

    expect(statusRadioValues()).not.toContain('cancelled')
  })

  it('已出貨的訂單可以改成已送達或已退款', () => {
    renderWithStatus('shipped')

    expect(statusRadioValues()).toEqual(['shipped', 'delivered', 'refunded'])
  })

  it('已送達的訂單只能改成已退款', () => {
    renderWithStatus('delivered')

    expect(statusRadioValues()).toEqual(['delivered', 'refunded'])
  })

  it('已取消的訂單顯示為最終狀態', () => {
    renderWithStatus('cancelled')

    expect(statusRadioValues()).toEqual(['cancelled'])
    expect(screen.getByText('此訂單已是最終狀態，無法再變更。')).toBeInTheDocument()
  })
})
