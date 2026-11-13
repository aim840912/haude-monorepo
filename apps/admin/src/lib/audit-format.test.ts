import { describe, it, expect } from 'vitest'
import { actionLabel, describeChanges, describeTarget, formatValue } from './audit-format'

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

describe('describeTarget', () => {
  const id = 'a1b2c3d4-e5f6-7890'
  const base = { resourceId: id, metadata: null }

  it('紀錄當下存的名稱優先，滑鼠提示有完整名稱與 ID', () => {
    expect(
      describeTarget({ ...base, metadata: { label: '冬茶' }, currentLabel: '春茶' }),
    ).toEqual({ text: '冬茶', title: `冬茶\nID：${id}` })
  })

  it('舊紀錄用查詢時補上的名稱，並註明是目前名稱', () => {
    expect(describeTarget({ ...base, currentLabel: '龍眼蜜' })).toMatchObject({
      text: '龍眼蜜',
      note: '目前名稱',
    })
  })

  it('網站設定的名稱就是 key，不會改名，不標示目前名稱', () => {
    const target = describeTarget({
      resource: 'site-settings',
      resourceId: 'home.hero',
      metadata: null,
      currentLabel: 'home.hero',
    })
    expect(target.text).toBe('home.hero')
    expect(target.note).toBeUndefined()
  })

  it('空白名稱視同沒有名稱', () => {
    expect(
      describeTarget({ ...base, metadata: { label: ' ' }, currentLabel: '龍眼蜜' }).text,
    ).toBe('龍眼蜜')
  })

  it('對象已不存在時說明找不到，ID 放在註記', () => {
    expect(describeTarget({ ...base, targetMissing: true })).toMatchObject({
      text: '已刪除或找不到',
      note: '#a1b2c3d4',
    })
  })

  it('沒有任何名稱資訊時才顯示 ID 前 8 碼', () => {
    expect(describeTarget(base).text).toBe('#a1b2c3d4')
  })

  it('沒有 ID 但有名稱時，滑鼠提示仍是完整名稱', () => {
    expect(describeTarget({ resourceId: null, metadata: { label: '全站維護' } })).toEqual({
      text: '全站維護',
      title: '全站維護',
    })
  })

  it('沒有對象時顯示破折號', () => {
    expect(describeTarget({ resourceId: null, metadata: null })).toEqual({ text: '—' })
  })
})
