/**
 * safeJsonLd 單元測試
 *
 * 測試功能：
 * - 跳脫可逸出 <script> 標籤的字元（< > &）
 * - 阻擋 JSON-LD stored XSS（跳出 ld+json 標籤注入可執行 script）
 * - 跳脫後仍為合法 JSON，語意不變
 *
 * 這些測試守護的是安全修復本身。若有人把 safeJsonLd 換回 JSON.stringify，
 * 或「簡化」掉其中一個 replace，此檔必須變紅。
 */

import { describe, it, expect } from 'vitest'
import { safeJsonLd } from './json-ld'

// ===== 基本跳脫行為 =====

describe('safeJsonLd', () => {
  describe('字元跳脫', () => {
    it('應該將 < 轉為 unicode escape', () => {
      expect(safeJsonLd({ a: '<' })).toBe('{"a":"\\u003c"}')
    })

    it('應該將 > 轉為 unicode escape', () => {
      expect(safeJsonLd({ a: '>' })).toBe('{"a":"\\u003e"}')
    })

    it('應該將 & 轉為 unicode escape', () => {
      expect(safeJsonLd({ a: '&' })).toBe('{"a":"\\u0026"}')
    })

    it('應該跳脫巢狀結構與陣列中的字元', () => {
      const result = safeJsonLd({
        outer: { inner: ['<script>', '&amp;'] },
      })

      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('&')
    })

    it('不應更動沒有特殊字元的內容', () => {
      expect(safeJsonLd({ name: '阿里山高山茶', price: 500 })).toBe(
        '{"name":"阿里山高山茶","price":500}'
      )
    })
  })

  // ===== 核心安全案例 =====

  describe('XSS 防護', () => {
    const XSS_PAYLOAD = '</script><script>alert(1)</script>'

    it('應該讓 script 標籤無法逸出（不含字面 </script>）', () => {
      const result = safeJsonLd({ name: XSS_PAYLOAD })

      // 這是整個修復的重點：輸出被塞進 <script type="application/ld+json">
      // 之中，只要含有字面的 </script> 就能提前關閉標籤並注入可執行 script
      expect(result).not.toContain('</script>')
      expect(result).not.toContain('<script>')
    })

    it('應該將 payload 中的角括號全部轉為 unicode escape', () => {
      const result = safeJsonLd({ name: XSS_PAYLOAD })

      expect(result).toContain('\\u003c/script\\u003e')
      expect(result).toContain('\\u003cscript\\u003e')
    })

    it('JSON.stringify 會逸出，safeJsonLd 不會（對照組）', () => {
      // 反向證明此修復確實有作用，而非測試恆真
      expect(JSON.stringify({ name: XSS_PAYLOAD })).toContain('</script>')
      expect(safeJsonLd({ name: XSS_PAYLOAD })).not.toContain('</script>')
    })
  })

  // ===== 語意保持 =====

  describe('JSON 合法性', () => {
    it('跳脫後仍是合法 JSON 且可還原出原始值', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '測試</script><script>alert(1)</script>',
        description: 'a < b && c > d',
      }

      const parsed = JSON.parse(safeJsonLd(schema))

      // 關鍵：跳脫的是「JSON 字串的表示法」而非「值本身」。
      // 若有人改用剝除字元的做法（如 replace(/</g, '')），這個斷言會失敗。
      expect(parsed).toEqual(schema)
    })

    it('應該正確處理陣列與數字型別', () => {
      const schema = { items: ['a', 'b'], count: 2, nested: { ok: true } }

      expect(JSON.parse(safeJsonLd(schema))).toEqual(schema)
    })
  })
})
