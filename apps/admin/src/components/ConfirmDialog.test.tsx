/**
 * ConfirmDialog 元件單元測試
 *
 * 測試功能：
 * - 基本渲染（開啟/關閉狀態）
 * - 標題和訊息顯示
 * - 確認和取消按鈕互動
 * - Loading 狀態處理
 * - 背景點擊關閉
 * - 自訂按鈕文字
 * - Variant 樣式
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    isOpen: true,
    isLoading: false,
    title: '確認刪除',
    message: '確定要刪除這個項目嗎？此操作無法復原。',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // 基本渲染測試
  // ========================================

  describe('基本渲染', () => {
    it('isOpen 為 true 時應該渲染對話框', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByText('確認刪除')).toBeInTheDocument()
      expect(screen.getByText('確定要刪除這個項目嗎？此操作無法復原。')).toBeInTheDocument()
    })

    it('isOpen 為 false 時不應該渲染對話框', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('確認刪除')).not.toBeInTheDocument()
    })

    it('應該顯示預設的確認和取消按鈕文字', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('應該顯示警告圖示', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      // AlertTriangle 圖示應該存在（透過 SVG 結構確認）
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  // ========================================
  // 自訂文字測試
  // ========================================

  describe('自訂文字', () => {
    it('應該使用自訂確認按鈕文字', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="刪除" />)

      expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument()
    })

    it('應該使用自訂取消按鈕文字', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="返回" />)

      expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
    })

    it('應該顯示自訂標題和訊息', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          title="確認下架"
          message="此產品將不再顯示於商店中。"
        />
      )

      expect(screen.getByText('確認下架')).toBeInTheDocument()
      expect(screen.getByText('此產品將不再顯示於商店中。')).toBeInTheDocument()
    })
  })

  // ========================================
  // 按鈕互動測試
  // ========================================

  describe('按鈕互動', () => {
    it('點擊確認按鈕應該觸發 onConfirm', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: '確認' })
      fireEvent.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('點擊取消按鈕應該觸發 onCancel', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: '取消' })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('點擊 X 按鈕應該觸發 onCancel', () => {
      render(<ConfirmDialog {...defaultProps} />)

      // X 按鈕是 header 中的第一個按鈕（在確認和取消按鈕之前）
      const allButtons = screen.getAllByRole('button')
      const closeButton = allButtons[0] // X 按鈕在最前面
      fireEvent.click(closeButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  // ========================================
  // Loading 狀態測試
  // ========================================

  describe('Loading 狀態', () => {
    it('Loading 時確認按鈕應該顯示處理中文字', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      expect(screen.getByRole('button', { name: /處理中/i })).toBeInTheDocument()
    })

    it('Loading 時確認按鈕應該被禁用', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      const confirmButton = screen.getByRole('button', { name: /處理中/i })
      expect(confirmButton).toBeDisabled()
    })

    it('Loading 時取消按鈕應該被禁用', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      const cancelButton = screen.getByRole('button', { name: '取消' })
      expect(cancelButton).toBeDisabled()
    })

    it('Loading 時 X 按鈕應該被禁用', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      const allButtons = screen.getAllByRole('button')
      const closeButton = allButtons[0]
      expect(closeButton).toBeDisabled()
    })

    it('Loading 時應該顯示 Spinner 圖示', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      // Loader2 圖示有 animate-spin class
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  // ========================================
  // 背景點擊測試
  // ========================================

  describe('背景點擊', () => {
    it('點擊背景應該觸發 onCancel', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      // 背景是最外層的 div，有 fixed inset-0 class
      const backdrop = container.querySelector('.fixed.inset-0')
      expect(backdrop).toBeInTheDocument()

      // 使用 mousedown 事件（元件使用 onMouseDown）
      fireEvent.mouseDown(backdrop!)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('Loading 時點擊背景不應該觸發 onCancel', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isLoading={true} />)

      const backdrop = container.querySelector('.fixed.inset-0')
      fireEvent.mouseDown(backdrop!)

      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('點擊對話框內容不應該觸發 onCancel', () => {
      render(<ConfirmDialog {...defaultProps} />)

      // 點擊訊息文字（對話框內部元素）
      const message = screen.getByText('確定要刪除這個項目嗎？此操作無法復原。')
      fireEvent.mouseDown(message)

      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })

  // ========================================
  // Variant 樣式測試
  // ========================================

  describe('Variant 樣式', () => {
    it('danger variant 應該使用紅色樣式', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} variant="danger" />
      )

      // 圖示容器應該有紅色背景
      const iconContainer = container.querySelector('.bg-red-100')
      expect(iconContainer).toBeInTheDocument()
    })

    it('warning variant 應該使用琥珀色樣式', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} variant="warning" />
      )

      // 圖示容器應該有琥珀色背景
      const iconContainer = container.querySelector('.bg-amber-100')
      expect(iconContainer).toBeInTheDocument()
    })

    it('預設應該使用 danger variant', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const iconContainer = container.querySelector('.bg-red-100')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  // ========================================
  // 無障礙功能測試
  // ========================================

  describe('無障礙功能', () => {
    it('所有按鈕應該可以透過鍵盤操作', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: '確認' })
      const cancelButton = screen.getByRole('button', { name: '取消' })

      // 確認按鈕可以聚焦
      confirmButton.focus()
      expect(document.activeElement).toBe(confirmButton)

      // 取消按鈕可以聚焦
      cancelButton.focus()
      expect(document.activeElement).toBe(cancelButton)
    })
  })
})
