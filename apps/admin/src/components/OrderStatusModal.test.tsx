/**
 * OrderStatusModal 元件單元測試
 *
 * 只列出 API 接受的狀態轉換（ORDER_STATUS_TRANSITIONS），
 * 避免管理員選了一個送出後才被 API 拒絕的狀態。
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('OrderStatusModal 失敗訊息', () => {
  it('顯示 API 回傳的原因（例如「請先退款」），而不是通用的失敗訊息', async () => {
    const reason = '此訂單已透過綠界付款，請先到「付款管理」執行退款'
    const onSave = vi.fn().mockResolvedValue(reason)
    render(
      <OrderStatusModal
        order={
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            userId: 'user-1',
            items: [],
            totalAmount: 1200,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: '2026-11-11T00:00:00.000Z',
          } as unknown as Order
        }
        isOpen
        isUpdating={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    fireEvent.click(document.querySelector<HTMLInputElement>('input[name="status"][value="cancelled"]')!)
    fireEvent.click(screen.getByRole('button', { name: '更新狀態' }))

    expect(await screen.findByText(reason)).toBeInTheDocument()
  })
})

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

  it('處理中的訂單可以取消', () => {
    renderWithStatus('processing')

    expect(statusRadioValues()).toContain('cancelled')
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
