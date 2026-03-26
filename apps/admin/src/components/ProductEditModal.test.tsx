/**
 * ProductEditModal 元件單元測試
 *
 * 測試功能：
 * - 基本渲染（新增/編輯/草稿模式）
 * - 表單欄位渲染
 * - 表單驗證
 * - 關閉功能
 * - Loading 狀態
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ProductEditModal } from './ProductEditModal'
import type { Product } from '@haude/types'

// Mock ImageManager 元件
vi.mock('./ImageManager', () => ({
  ImageManager: () => <div data-testid="product-image-manager">產品圖片管理器</div>,
}))

// Mock productImagesApi
vi.mock('../services/api', () => ({
  productImagesApi: {
    getImages: vi.fn().mockResolvedValue({ data: [] }),
    deleteImage: vi.fn().mockResolvedValue({}),
  },
}))

// Mock logger
vi.mock('../lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// 建立 Mock 產品
function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-123',
    name: '阿里山烏龍茶',
    description: '高山茶區種植的優質烏龍茶',
    category: '茶葉',
    price: 1200,
    stock: 50,
    isActive: true,
    isDraft: false,
    images: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  }
}

describe('ProductEditModal', () => {
  const mockOnClose = vi.fn()
  const mockOnCreate = vi.fn()
  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  const defaultProps = {
    product: null,
    isOpen: true,
    isLoading: false,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnCreate.mockResolvedValue(true)
    mockOnUpdate.mockResolvedValue(true)
    mockOnDelete.mockResolvedValue({ success: true })
  })

  // ========================================
  // 基本渲染測試
  // ========================================

  describe('基本渲染', () => {
    it('isOpen 為 false 時不應該渲染對話框', () => {
      render(<ProductEditModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('新增產品')).not.toBeInTheDocument()
    })

    it('新增模式應該顯示新增產品標題', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={null} />)
      })
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('新增產品')
    })

    it('編輯模式應該顯示編輯產品標題', async () => {
      const product = createMockProduct()
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('編輯產品')
    })

    it('草稿模式應該顯示新增產品標題', async () => {
      const product = createMockProduct({ isDraft: true })
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('新增產品')
    })
  })

  // ========================================
  // 表單欄位測試
  // ========================================

  describe('表單欄位', () => {
    it('應該渲染所有必要欄位標籤', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      expect(screen.getByText(/產品名稱/)).toBeInTheDocument()
      expect(screen.getByText(/分類/)).toBeInTheDocument()
      expect(screen.getByText(/價格/)).toBeInTheDocument()
      expect(screen.getByText(/庫存/)).toBeInTheDocument()
      expect(screen.getByText(/產品描述/)).toBeInTheDocument()
      expect(screen.getByText(/上架狀態/)).toBeInTheDocument()
    })

    it('編輯模式應該填入現有產品資料', async () => {
      const product = createMockProduct({
        name: '日月潭紅茶',
        category: '紅茶',
        price: 800,
        stock: 30,
        description: '台灣日月潭特產',
      })
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })

      expect(screen.getByDisplayValue('日月潭紅茶')).toBeInTheDocument()
      expect(screen.getByDisplayValue('紅茶')).toBeInTheDocument()
      expect(screen.getByDisplayValue('800')).toBeInTheDocument()
      expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      expect(screen.getByDisplayValue('台灣日月潭特產')).toBeInTheDocument()
    })

    it('編輯模式應該顯示產品圖片管理器', async () => {
      const product = createMockProduct()
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })

      expect(screen.getByTestId('product-image-manager')).toBeInTheDocument()
    })

    it('新增模式不應該顯示產品圖片管理器', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={null} />)
      })

      expect(screen.queryByTestId('product-image-manager')).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 表單驗證測試
  // ========================================

  describe('表單驗證', () => {
    it('產品名稱為空時應該顯示錯誤', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const submitButton = screen.getByRole('button', { name: '新增產品' })
      fireEvent.click(submitButton)

      expect(screen.getByText('產品名稱不能為空')).toBeInTheDocument()
      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('有產品名稱時應該能提交', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const textboxes = screen.getAllByRole('textbox')
      fireEvent.change(textboxes[0], { target: { value: '測試產品' } })

      const submitButton = screen.getByRole('button', { name: '新增產品' })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled()
      })
    })
  })

  // ========================================
  // Loading 狀態測試
  // ========================================

  describe('Loading 狀態', () => {
    it('isLoading 為 true 時輸入框應該禁用', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} isLoading={true} />)
      })

      const textboxes = screen.getAllByRole('textbox')
      textboxes.forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('isLoading 為 true 時提交按鈕應該顯示「儲存中...」', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} isLoading={true} />)
      })

      expect(screen.getByRole('button', { name: /儲存中/i })).toBeInTheDocument()
    })

    it('isLoading 為 true 時按鈕應該被禁用', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} isLoading={true} />)
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  // ========================================
  // 上架狀態測試
  // ========================================

  describe('上架狀態', () => {
    it('預設應該選擇「上架」', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const activeRadio = screen.getByRole('radio', { name: '上架' }) as HTMLInputElement
      expect(activeRadio.checked).toBe(true)
    })

    it('可以切換為「下架」', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const inactiveRadio = screen.getByRole('radio', { name: '下架' })
      fireEvent.click(inactiveRadio)

      expect((inactiveRadio as HTMLInputElement).checked).toBe(true)
    })

    it('編輯模式應該顯示現有上架狀態', async () => {
      const product = createMockProduct({ isActive: false })
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })

      const inactiveRadio = screen.getByRole('radio', { name: '下架' }) as HTMLInputElement
      expect(inactiveRadio.checked).toBe(true)
    })
  })

  // ========================================
  // 表單欄位變更測試
  // ========================================

  describe('表單欄位變更', () => {
    it('應該能更新產品名稱', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const textboxes = screen.getAllByRole('textbox')
      fireEvent.change(textboxes[0], { target: { value: '新茶品' } })
      expect(textboxes[0]).toHaveValue('新茶品')
    })

    it('應該能更新價格', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const spinbuttons = screen.getAllByRole('spinbutton')
      fireEvent.change(spinbuttons[0], { target: { value: '999' } })
      expect(spinbuttons[0]).toHaveValue(999)
    })

    it('應該能更新描述', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      const textboxes = screen.getAllByRole('textbox')
      fireEvent.change(textboxes[1], { target: { value: '這是產品描述' } })
      expect(textboxes[1]).toHaveValue('這是產品描述')
    })
  })

  // ========================================
  // 按鈕測試
  // ========================================

  describe('按鈕', () => {
    it('應該顯示取消和提交按鈕', async () => {
      await act(async () => {
        render(<ProductEditModal {...defaultProps} />)
      })

      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '新增產品' })).toBeInTheDocument()
    })

    it('編輯模式提交按鈕應該顯示「儲存變更」', async () => {
      const product = createMockProduct()
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })

      expect(screen.getByRole('button', { name: '儲存變更' })).toBeInTheDocument()
    })

    it('草稿模式提交按鈕應該顯示「新增產品」', async () => {
      const product = createMockProduct({ isDraft: true })
      await act(async () => {
        render(<ProductEditModal {...defaultProps} product={product} />)
      })

      expect(screen.getByRole('button', { name: '新增產品' })).toBeInTheDocument()
    })
  })
})
