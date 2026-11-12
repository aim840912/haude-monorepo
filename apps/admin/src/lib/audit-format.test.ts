import { describe, it, expect } from 'vitest'
import { actionLabel, describeChanges, formatValue } from './audit-format'

describe('actionLabel', () => {
  it('圖片子路由標成圖片操作，不是刪除整個產品', () => {
    expect(
      actionLabel('DELETE', { method: 'DELETE', path: '/api/v1/admin/products/p1/images/i1' }),
    ).toBe('刪除圖片')
  })

  it('一般操作用動作的中文', () => {
    expect(actionLabel('DELETE', { method: 'DELETE', path: '/api/v1/products/p1' })).toBe('刪除')
  })
})

describe('describeChanges', () => {
  it('只列出值有變的欄位', () => {
    const changes = describeChanges({
      before: { name: '龍眼蜜', price: 550, stock: 60 },
      body: { name: '龍眼蜜', price: 600 },
    })
    expect(changes).toEqual([{ field: 'price', from: 550, to: 600, hasBefore: true }])
  })

  it('沒有改前資料時，送出的欄位都列為新值', () => {
    expect(describeChanges({ body: { name: '冬茶' } })).toEqual([
      { field: 'name', from: undefined, to: '冬茶', hasBefore: false },
    ])
  })

  it('欄位名剛好是物件內建屬性（constructor）時不誤判為有改前值', () => {
    const [change] = describeChanges({ before: {}, body: { constructor: 'x' } })
    expect(change.hasBefore).toBe(false)
    expect(change.from).toBeUndefined()
  })

  it('改前資料沒有的欄位（如積分調整量）不顯示成「空 → 值」', () => {
    const [change] = describeChanges({
      before: { currentPoints: 500 },
      body: { points: 100 },
    })
    expect(change.hasBefore).toBe(false)
  })
})

describe('formatValue', () => {
  it('布林與空值轉成中文', () => {
    expect(formatValue(true)).toBe('是')
    expect(formatValue(null)).toBe('（空）')
  })
})
