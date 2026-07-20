/**
 * ProductSchema 元件單元測試
 *
 * 測試功能：
 * - JSON-LD 正確渲染為 <script type="application/ld+json">
 * - 管理員可編輯欄位（產品名稱/描述）不會逸出 script 標籤
 * - 庫存與評分的條件分支
 *
 * 與 src/lib/json-ld.test.ts 的分工：
 * 那支測「跳脫函式本身正確」，這支測「元件確實有用它」。
 * 兩者缺一不可——函式再正確，元件忘了呼叫也一樣會出事。
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProductSchema } from './ProductSchema'
import { createMockProduct } from '@/test/mocks'

/** 取出元件渲染出的 JSON-LD 原始字串 */
function renderSchema(ui: React.ReactElement): string {
  const { container } = render(ui)
  const script = container.querySelector('script[type="application/ld+json"]')

  // 先確認元件真的有渲染出 JSON-LD。
  // 少了這道，「找不到攻擊字串」可能只是因為元件根本沒渲染 —— 假陰性。
  expect(script).not.toBeNull()

  return script!.innerHTML
}

describe('ProductSchema', () => {
  // ===== 基本渲染 =====

  describe('基本渲染', () => {
    it('應該渲染 application/ld+json script 標籤', () => {
      const json = renderSchema(<ProductSchema product={createMockProduct()} />)

      expect(json).toContain('"@type":"Product"')
    })

    it('應該包含產品名稱、價格與 SKU', () => {
      const product = createMockProduct({
        id: 'prod-42',
        name: '阿里山高山烏龍茶',
        price: 880,
      })

      const parsed = JSON.parse(renderSchema(<ProductSchema product={product} />))

      expect(parsed.name).toBe('阿里山高山烏龍茶')
      expect(parsed.sku).toBe('prod-42')
      expect(parsed.offers.price).toBe(880)
    })

    it('有庫存時應標記 InStock，無庫存時標記 OutOfStock', () => {
      const inStock = JSON.parse(
        renderSchema(<ProductSchema product={createMockProduct({ stock: 5 })} />)
      )
      const outOfStock = JSON.parse(
        renderSchema(<ProductSchema product={createMockProduct({ stock: 0 })} />)
      )

      expect(inStock.offers.availability).toBe('https://schema.org/InStock')
      expect(outOfStock.offers.availability).toBe('https://schema.org/OutOfStock')
    })

    it('有評論時應加入 aggregateRating，無評論時不應加入', () => {
      const withReviews = JSON.parse(
        renderSchema(
          <ProductSchema
            product={createMockProduct()}
            reviewStats={{ averageRating: 4.25, totalReviews: 8 }}
          />
        )
      )
      const noReviews = JSON.parse(
        renderSchema(
          <ProductSchema
            product={createMockProduct()}
            reviewStats={{ averageRating: 0, totalReviews: 0 }}
          />
        )
      )

      expect(withReviews.aggregateRating.reviewCount).toBe(8)
      expect(withReviews.aggregateRating.ratingValue).toBe('4.3')
      expect(noReviews.aggregateRating).toBeUndefined()
    })
  })

  // ===== 核心安全案例 =====

  describe('XSS 防護', () => {
    const XSS_PAYLOAD = '測試</script><script>alert(1)</script>'

    it('產品名稱含 script 標籤時不應逸出 ld+json 區塊', () => {
      const product = createMockProduct({ name: XSS_PAYLOAD })
      const json = renderSchema(<ProductSchema product={product} />)

      // 攻擊面確實存在（payload 有進到 schema），但已被跳脫
      expect(json).toContain('\\u003c/script\\u003e')
      expect(json).not.toContain('</script>')
      expect(json).not.toContain('<script>')
    })

    it('產品描述含 script 標籤時同樣不應逸出', () => {
      const product = createMockProduct({ description: XSS_PAYLOAD })
      const json = renderSchema(<ProductSchema product={product} />)

      expect(json).not.toContain('</script>')
    })

    it('跳脫後 JSON 仍可解析，且還原出原始名稱', () => {
      const product = createMockProduct({ name: XSS_PAYLOAD })
      const parsed = JSON.parse(renderSchema(<ProductSchema product={product} />))

      // 證明防護方式是「跳脫」而非「刪字元」——搜尋引擎讀到的仍是原始內容
      expect(parsed.name).toBe(XSS_PAYLOAD)
    })
  })
})
