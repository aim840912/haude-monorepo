/**
 * ProductCard 元件單元測試
 *
 * 測試功能：
 * - 產品基本資訊渲染
 * - 折扣標籤顯示邏輯
 * - 缺貨狀態顯示
 * - 收藏按鈕互動
 * - 點擊事件處理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'
import { createMockProduct, createMockProductImage } from '@/test/mocks'

// Mock Next.js Image 元件
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: { src: string; alt: string; onError?: () => void; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid="product-image"
      onError={onError}
      {...props}
    />
  ),
}))

// Mock placeholder config
vi.mock('@/config/placeholder.config', () => ({
  PLACEHOLDER_IMAGES: {
    product: (category?: string) => `https://placeholder.com/${category || 'default'}.jpg`,
  },
}))

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}))

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // 基本渲染測試
  // ========================================

  describe('基本渲染', () => {
    it('應該正確渲染產品名稱', () => {
      const product = createMockProduct({ name: '阿里山烏龍茶' })
      render(<ProductCard product={product} />)

      expect(screen.getByText('阿里山烏龍茶')).toBeInTheDocument()
    })

    it('應該正確渲染產品類別', () => {
      const product = createMockProduct({ category: '茶葉' })
      render(<ProductCard product={product} />)

      expect(screen.getByText('茶葉')).toBeInTheDocument()
    })

    it('應該正確渲染產品價格', () => {
      const product = createMockProduct({ price: 1500 })
      render(<ProductCard product={product} />)

      expect(screen.getByText(/NT\$ 1,500/)).toBeInTheDocument()
    })

    it('應該正確渲染庫存數量', () => {
      const product = createMockProduct({ stock: 50 })
      render(<ProductCard product={product} />)

      expect(screen.getByText('庫存: 50')).toBeInTheDocument()
    })

    it('應該顯示價格單位', () => {
      const product = createMockProduct({ price: 500, priceUnit: '100g' })
      render(<ProductCard product={product} />)

      expect(screen.getByText(/\/ 100g/)).toBeInTheDocument()
    })

    it('應該使用產品圖片 URL', () => {
      const product = createMockProduct({
        images: [createMockProductImage({ storageUrl: 'https://example.com/tea.jpg' })],
      })
      render(<ProductCard product={product} />)

      const image = screen.getByTestId('product-image')
      expect(image).toHaveAttribute('src', 'https://example.com/tea.jpg')
    })

    it('沒有圖片時應該使用 placeholder', () => {
      const product = createMockProduct({ images: [], category: '茶葉' })
      render(<ProductCard product={product} />)

      const image = screen.getByTestId('product-image')
      expect(image).toHaveAttribute('src', 'https://placeholder.com/茶葉.jpg')
    })
  })

  // ========================================
  // 折扣標籤測試
  // ========================================

  describe('折扣標籤', () => {
    it('有折扣時應該顯示折扣百分比', () => {
      const product = createMockProduct({
        price: 800,
        originalPrice: 1000, // 20% 折扣
      })
      render(<ProductCard product={product} />)

      expect(screen.getByText('特價 -20%')).toBeInTheDocument()
    })

    it('應該顯示原價（刪除線）', () => {
      const product = createMockProduct({
        price: 800,
        originalPrice: 1000,
      })
      render(<ProductCard product={product} />)

      expect(screen.getByText('NT$ 1,000')).toBeInTheDocument()
    })

    it('沒有折扣時不應該顯示折扣標籤', () => {
      const product = createMockProduct({
        price: 1000,
        originalPrice: undefined,
      })
      render(<ProductCard product={product} />)

      expect(screen.queryByText(/特價/)).not.toBeInTheDocument()
    })

    it('原價等於現價時不應該顯示折扣', () => {
      const product = createMockProduct({
        price: 1000,
        originalPrice: 1000,
      })
      render(<ProductCard product={product} />)

      expect(screen.queryByText(/特價/)).not.toBeInTheDocument()
    })

    it('應該正確計算 33% 折扣', () => {
      const product = createMockProduct({
        price: 670,
        originalPrice: 1000, // ~33%
      })
      render(<ProductCard product={product} />)

      expect(screen.getByText('特價 -33%')).toBeInTheDocument()
    })
  })

  // ========================================
  // 庫存狀態測試
  // ========================================

  describe('庫存狀態', () => {
    it('缺貨時應該顯示缺貨標籤和缺貨狀態', () => {
      const product = createMockProduct({ stock: 0 })
      render(<ProductCard product={product} />)

      // 頁面上有兩個「缺貨中」：標籤區域和庫存資訊區域
      const outOfStockTexts = screen.getAllByText('缺貨中')
      expect(outOfStockTexts).toHaveLength(2)
    })

    it('負庫存時也應該顯示缺貨', () => {
      // 雖然不應該發生，但防禦性測試
      const product = createMockProduct({ stock: -5 })
      render(<ProductCard product={product} />)

      const outOfStockTexts = screen.getAllByText('缺貨中')
      expect(outOfStockTexts).toHaveLength(2)
    })

    it('有庫存時應該顯示綠色庫存數量', () => {
      const product = createMockProduct({ stock: 100 })
      render(<ProductCard product={product} />)

      const stockText = screen.getByText('庫存: 100')
      expect(stockText).toBeInTheDocument()
    })
  })

  // ========================================
  // 事件處理測試
  // ========================================

  describe('事件處理', () => {
    it('點擊卡片應該觸發 onProductClick', () => {
      const product = createMockProduct()
      const handleClick = vi.fn()
      render(<ProductCard product={product} onProductClick={handleClick} />)

      // 找到可點擊的外層容器
      const card = screen.getByRole('img', { name: product.name }).closest('div[class*="cursor-pointer"]')
      fireEvent.click(card!)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(product)
    })

    it('點擊收藏按鈕應該觸發 onToggleInterest', () => {
      const product = createMockProduct({ id: 'prod-123' })
      const handleToggle = vi.fn()
      render(
        <ProductCard
          product={product}
          onToggleInterest={handleToggle}
        />
      )

      const favoriteButton = screen.getByRole('button', { name: '加入收藏' })
      fireEvent.click(favoriteButton)

      expect(handleToggle).toHaveBeenCalledTimes(1)
      expect(handleToggle).toHaveBeenCalledWith('prod-123')
    })

    it('點擊收藏按鈕不應該觸發產品點擊', () => {
      const product = createMockProduct()
      const handleClick = vi.fn()
      const handleToggle = vi.fn()
      render(
        <ProductCard
          product={product}
          onProductClick={handleClick}
          onToggleInterest={handleToggle}
        />
      )

      const favoriteButton = screen.getByRole('button', { name: '加入收藏' })
      fireEvent.click(favoriteButton)

      // 只有 toggle 被觸發，click 不應該被觸發
      expect(handleToggle).toHaveBeenCalledTimes(1)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('已收藏時應該顯示「移除收藏」按鈕', () => {
      const product = createMockProduct()
      render(
        <ProductCard
          product={product}
          isInterested={true}
          onToggleInterest={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: '移除收藏' })).toBeInTheDocument()
    })
  })

  // ========================================
  // 收藏按鈕顯示邏輯
  // ========================================

  describe('收藏按鈕顯示', () => {
    it('未提供 onToggleInterest 時不應該渲染收藏按鈕', () => {
      const product = createMockProduct()
      render(<ProductCard product={product} />)

      expect(screen.queryByRole('button', { name: /收藏/ })).not.toBeInTheDocument()
    })

    it('提供 onToggleInterest 時應該渲染收藏按鈕', () => {
      const product = createMockProduct()
      render(
        <ProductCard
          product={product}
          onToggleInterest={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: '加入收藏' })).toBeInTheDocument()
    })
  })

  // ========================================
  // 複合場景測試
  // ========================================

  describe('複合場景', () => {
    it('缺貨且有折扣應該同時顯示兩個標籤', () => {
      const product = createMockProduct({
        stock: 0,
        price: 800,
        originalPrice: 1000,
      })
      render(<ProductCard product={product} />)

      // 頁面上有兩個「缺貨中」：標籤區域和庫存資訊區域
      const outOfStockTexts = screen.getAllByText('缺貨中')
      expect(outOfStockTexts).toHaveLength(2)
      expect(screen.getByText('特價 -20%')).toBeInTheDocument()
    })

    it('完整產品資訊應該正確渲染', () => {
      const product = createMockProduct({
        name: '阿里山烏龍茶禮盒',
        category: '禮盒',
        price: 2400,
        originalPrice: 3000,
        priceUnit: '盒',
        stock: 25,
        images: [createMockProductImage({ storageUrl: 'https://example.com/gift.jpg' })],
      })
      const handleClick = vi.fn()
      const handleToggle = vi.fn()

      render(
        <ProductCard
          product={product}
          isInterested={false}
          onProductClick={handleClick}
          onToggleInterest={handleToggle}
        />
      )

      // 驗證所有資訊都正確顯示
      expect(screen.getByText('阿里山烏龍茶禮盒')).toBeInTheDocument()
      expect(screen.getByText('禮盒')).toBeInTheDocument()
      expect(screen.getByText(/NT\$ 2,400/)).toBeInTheDocument()
      expect(screen.getByText(/\/ 盒/)).toBeInTheDocument()
      expect(screen.getByText('NT$ 3,000')).toBeInTheDocument()
      expect(screen.getByText('特價 -20%')).toBeInTheDocument()
      expect(screen.getByText('庫存: 25')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '加入收藏' })).toBeInTheDocument()
    })
  })
})
