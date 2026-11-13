/**
 * NotificationBell 元件單元測試
 *
 * 輪詢只更新未讀數字，不更新列表；打開鈴鐺時必須重抓列表，
 * 否則徽章顯示「1」、點開卻是「目前沒有通知」。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from './NotificationBell'
import { notificationsApi } from '../../services/api'

vi.mock('../../services/api', () => ({
  notificationsApi: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
}))

const getAll = vi.mocked(notificationsApi.getAll)
const getUnreadCount = vi.mocked(notificationsApi.getUnreadCount)

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAll.mockResolvedValue({ data: { notifications: [], total: 0 } } as never)
    getUnreadCount.mockResolvedValue({ data: { count: 0 } } as never)
  })

  it('打開時重新抓通知列表，看得到載入頁面之後才產生的通知', async () => {
    render(<NotificationBell />)
    await waitFor(() => expect(getAll).toHaveBeenCalledTimes(1))

    getAll.mockResolvedValue({
      data: {
        notifications: [
          {
            id: 'n1',
            type: 'LOW_STOCK',
            title: '庫存預警',
            message: '產品「冬茶」庫存不足',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      },
    } as never)

    await userEvent.click(screen.getByTitle('通知中心'))

    expect(await screen.findByText('產品「冬茶」庫存不足')).toBeInTheDocument()
    expect(getAll).toHaveBeenCalledTimes(2)
  })
})
