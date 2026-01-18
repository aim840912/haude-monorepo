/**
 * ProductDetailModal 元件單元測試
 *
 * 測試功能：
 * - Modal 渲染和基本資訊顯示
 * - 關閉按鈕和背景點擊關閉
 * - 數量選擇器功能
 * - 圖片切換功能
 * - 收藏和詢價操作
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductDetailModal } from './ProductDetailModal'
import { createMockProduct, createMockProductImage } from '@/test/mocks'
import type { ExtendedProduct } from './modal/types'

// Mock createPortal - 直接渲染到容器而非 document.body
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: { src: string; alt: string; onError?: (e: { target: HTMLImageElement }) => void; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid="product-image"
      onError={() => onError?.({ target: { src: '' } as HTMLImageElement })}
      {...props}
    />
  ),
}))

// Mock useModalAnimation hook
vi.mock('@/hooks/useModalAnimation', () => ({
  useModalAnimation: () => ({
    shouldRender: true,
    backdropClasses: 'backdrop-class',
    contentClasses: 'content-class',
  }),
  useEscapeKey: vi.fn(),
  useFocusTrap: vi.fn(),
}))

// Mock useToast hook
vi.mock('@/components/ui/feedback/toast/hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
    toasts: [],
  }),
}))

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}))

// 創建擴展產品 mock
function createMockExtendedProduct(
  overrides: Partial<ExtendedProduct> = {}
): ExtendedProduct {
  const baseProduct = createMockProduct()
  return {
    ...baseProduct,
    features: ['高山茶區種植', '手工採摘', '傳統工藝製作'],
    specifications: [
      { label: '產地', value: '阿里山' },
      { label: '重量', value: '150g' },
    ],
    ...overrides,
  }
}

describe('ProductDetailModal', () => {
  const mockOnClose = vi.fn()
  const mockOnToggleInterest = vi.fn()
  const mockOnRequestQuote = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================
  // 基本渲染測試
  // ========================================

  describe('基本渲染', () => {
    it('應該渲染 Modal 對話框', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('應該顯示產品名稱', () => {
      const product = createMockExtendedProduct({ name: '頂級烏龍茶' })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('頂級烏龍茶')).toBeInTheDocument()
    })

    it('應該顯示產品描述', () => {
      const product = createMockExtendedProduct({ description: '精選阿里山茶葉' })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('精選阿里山茶葉')).toBeInTheDocument()
    })

    it('應該顯示產品價格', () => {
      const product = createMockExtendedProduct({ price: 1200 })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/1,200/)).toBeInTheDocument()
    })

    it('應該顯示產品圖片', () => {
      const product = createMockExtendedProduct({
        images: [createMockProductImage({ storageUrl: 'https://example.com/tea.jpg' })],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const images = screen.getAllByTestId('product-image')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/tea.jpg')
    })
  })

  // ========================================
  // 關閉功能測試
  // ========================================

  describe('關閉功能', () => {
    it('點擊關閉按鈕應該觸發 onClose', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: '關閉產品詳細資訊視窗' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('點擊背景應該觸發 onClose', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('點擊 Modal 內容不應該觸發 onClose', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 點擊產品名稱（Modal 內部元素）
      const productName = screen.getByText(product.name)
      fireEvent.click(productName)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  // ========================================
  // 產品特色和規格測試
  // ========================================

  describe('產品特色和規格', () => {
    it('應該顯示產品特色列表', () => {
      const product = createMockExtendedProduct({
        features: ['有機種植', '無農藥', '手工採摘'],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('有機種植')).toBeInTheDocument()
      expect(screen.getByText('無農藥')).toBeInTheDocument()
      expect(screen.getByText('手工採摘')).toBeInTheDocument()
    })

    it('應該顯示產品規格', () => {
      const product = createMockExtendedProduct({
        specifications: [
          { label: '產地', value: '台灣阿里山' },
          { label: '淨重', value: '200g' },
        ],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('產地')).toBeInTheDocument()
      expect(screen.getByText('台灣阿里山')).toBeInTheDocument()
      expect(screen.getByText('淨重')).toBeInTheDocument()
      expect(screen.getByText('200g')).toBeInTheDocument()
    })

    it('沒有特色時不應該顯示特色區塊', () => {
      const product = createMockExtendedProduct({ features: undefined })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 產品特色區塊不應存在
      expect(screen.queryByText('產品特色')).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 數量選擇器測試
  // ========================================

  describe('數量選擇器', () => {
    it('應該顯示數量選擇器', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 數量在 input 元素中，預設為 1
      const quantityInput = screen.getByRole('spinbutton', { name: '產品數量' })
      expect(quantityInput).toHaveValue(1)
    })

    it('點擊增加按鈕應該增加數量', () => {
      const product = createMockExtendedProduct({ stock: 10 })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const increaseButton = screen.getByRole('button', { name: '增加數量' })
      fireEvent.click(increaseButton)

      const quantityInput = screen.getByRole('spinbutton', { name: '產品數量' })
      expect(quantityInput).toHaveValue(2)
    })

    it('點擊減少按鈕應該減少數量', () => {
      const product = createMockExtendedProduct({ stock: 10 })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 先增加到 2
      const increaseButton = screen.getByRole('button', { name: '增加數量' })
      fireEvent.click(increaseButton)

      // 再減少
      const decreaseButton = screen.getByRole('button', { name: '減少數量' })
      fireEvent.click(decreaseButton)

      const quantityInput = screen.getByRole('spinbutton', { name: '產品數量' })
      expect(quantityInput).toHaveValue(1)
    })

    it('數量為 1 時減少按鈕應該被禁用', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const decreaseButton = screen.getByRole('button', { name: '減少數量' })
      expect(decreaseButton).toBeDisabled()
    })
  })

  // ========================================
  // 圖片切換測試
  // ========================================

  describe('圖片切換', () => {
    it('多張圖片時應該顯示縮圖導航', () => {
      const product = createMockExtendedProduct({
        images: [
          createMockProductImage({ id: 'img-1', storageUrl: 'https://example.com/1.jpg' }),
          createMockProductImage({ id: 'img-2', storageUrl: 'https://example.com/2.jpg' }),
          createMockProductImage({ id: 'img-3', storageUrl: 'https://example.com/3.jpg' }),
        ],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 應該有 3 個縮圖按鈕
      const thumbnailButtons = screen.getAllByRole('button', { name: /切換到圖片/ })
      expect(thumbnailButtons).toHaveLength(3)
    })

    it('點擊縮圖應該切換主圖片', () => {
      const product = createMockExtendedProduct({
        images: [
          createMockProductImage({ id: 'img-1', storageUrl: 'https://example.com/1.jpg' }),
          createMockProductImage({ id: 'img-2', storageUrl: 'https://example.com/2.jpg' }),
        ],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 點擊第二張圖片
      const secondThumbnail = screen.getByRole('button', { name: /切換到圖片 2/ })
      fireEvent.click(secondThumbnail)

      // 確認主圖片已切換
      const mainImage = screen.getAllByTestId('product-image')[0]
      expect(mainImage).toHaveAttribute('src', 'https://example.com/2.jpg')
    })

    it('單張圖片時不應該顯示縮圖導航', () => {
      const product = createMockExtendedProduct({
        images: [createMockProductImage({ storageUrl: 'https://example.com/single.jpg' })],
      })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      // 不應該有縮圖按鈕
      expect(screen.queryByRole('button', { name: /切換到圖片/ })).not.toBeInTheDocument()
    })
  })

  // ========================================
  // 收藏和詢價功能測試
  // ========================================

  describe('收藏和詢價功能', () => {
    it('提供 onToggleInterest 時應該顯示收藏按鈕', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
          onToggleInterest={mockOnToggleInterest}
        />
      )

      // 收藏按鈕應該存在（確切文字可能因子元件而異）
      const favoriteButton = screen.getByRole('button', { name: /收藏|喜歡|加入收藏/i })
      expect(favoriteButton).toBeInTheDocument()
    })

    it('點擊收藏按鈕應該觸發 onToggleInterest', () => {
      const product = createMockExtendedProduct({ id: 'prod-999', name: '測試茶葉' })
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
          onToggleInterest={mockOnToggleInterest}
        />
      )

      const favoriteButton = screen.getByRole('button', { name: /收藏|喜歡|加入收藏/i })
      fireEvent.click(favoriteButton)

      expect(mockOnToggleInterest).toHaveBeenCalledWith('prod-999', '測試茶葉')
    })

    it('提供 onRequestQuote 時應該顯示詢價按鈕', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
          onRequestQuote={mockOnRequestQuote}
        />
      )

      const quoteButton = screen.getByRole('button', { name: /詢價|報價/i })
      expect(quoteButton).toBeInTheDocument()
    })
  })

  // ========================================
  // 無障礙功能測試
  // ========================================

  describe('無障礙功能', () => {
    it('Modal 應該具有正確的 ARIA 屬性', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('關閉按鈕應該有 aria-label', () => {
      const product = createMockExtendedProduct()
      render(
        <ProductDetailModal
          product={product}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: '關閉產品詳細資訊視窗' })
      expect(closeButton).toBeInTheDocument()
    })
  })

  // ========================================
  // 產品變更時重置狀態
  // ========================================

  describe('產品變更', () => {
    it('產品變更時應該重置數量為 1', () => {
      const product1 = createMockExtendedProduct({ id: 'prod-1' })
      const product2 = createMockExtendedProduct({ id: 'prod-2' })

      const { rerender } = render(
        <ProductDetailModal
          product={product1}
          onClose={mockOnClose}
        />
      )

      // 增加數量到 3
      const increaseButton = screen.getByRole('button', { name: '增加數量' })
      fireEvent.click(increaseButton)
      fireEvent.click(increaseButton)

      const quantityInput = screen.getByRole('spinbutton', { name: '產品數量' })
      expect(quantityInput).toHaveValue(3)

      // 切換產品
      rerender(
        <ProductDetailModal
          product={product2}
          onClose={mockOnClose}
        />
      )

      // 數量應該重置為 1
      const resetQuantityInput = screen.getByRole('spinbutton', { name: '產品數量' })
      expect(resetQuantityInput).toHaveValue(1)
    })
  })
})
