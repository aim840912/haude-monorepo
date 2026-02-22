/**
 * SSR-safe 元素滾動進度追蹤 hook
 *
 * 取代 Framer Motion 的 useScroll({ target }) 以避免
 * Next.js SSR hydration 時 "Target ref is defined but not hydrated" 錯誤。
 *
 * 使用 useMotionValue + scroll event listener，
 * 在 useEffect 中啟動追蹤（純客戶端），完全避免 hydration 問題。
 */

'use client'

import { useEffect, type RefObject } from 'react'
import { useMotionValue } from 'framer-motion'

type ScrollKeyword = 'start' | 'end' | 'center'
type ScrollOffset = ScrollKeyword | `${number}%`
type OffsetPair = `${ScrollOffset} ${ScrollOffset}`

/**
 * 追蹤元素相對於視窗的滾動進度（0→1）
 *
 * @param ref - 目標元素的 ref
 * @param offset - 觸發範圍，預設 ["start end", "end start"]
 *   - "start end" = 元素頂部到達視窗底部時開始（progress=0）
 *   - "end start" = 元素底部到達視窗頂部時結束（progress=1）
 *   - "start start" = 元素頂部到達視窗頂部（用於 sticky scroll）
 *   - "end end" = 元素底部到達視窗底部
 */
export function useElementScroll(
  ref: RefObject<HTMLElement | null>,
  offset: [OffsetPair, OffsetPair] = ['start end', 'end start']
) {
  const scrollYProgress = useMotionValue(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const calculateProgress = () => {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementHeight = rect.height

      // 解析 offset 配置
      const [startOffset, endOffset] = offset
      const startPos = getPosition(startOffset, rect, windowHeight, elementHeight)
      const endPos = getPosition(endOffset, rect, windowHeight, elementHeight)

      const totalDistance = startPos - endPos
      if (totalDistance === 0) return

      const currentProgress = startPos / totalDistance
      scrollYProgress.set(Math.max(0, Math.min(1, currentProgress)))
    }

    // 使用 rAF 節流避免過度計算
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          calculateProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll() // 初始計算

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [ref, offset, scrollYProgress])

  return { scrollYProgress }
}

/**
 * 計算 offset 對應的像素距離
 * 回傳「元素參考點」與「視窗參考點」之間的距離
 */
function getPosition(
  offsetStr: OffsetPair,
  rect: DOMRect,
  windowHeight: number,
  elementHeight: number
): number {
  const [elementEdge, viewportEdge] = offsetStr.split(' ') as [ScrollOffset, ScrollOffset]

  // 元素參考點（相對於視窗頂部）
  const elementPos = resolveOffset(elementEdge, rect.top, elementHeight)

  // 視窗參考點
  const viewportPos = resolveOffset(viewportEdge, 0, windowHeight)

  return elementPos - viewportPos
}

/** Resolve a keyword or percentage offset to a pixel value */
function resolveOffset(offset: ScrollOffset, base: number, size: number): number {
  if (offset.endsWith('%')) {
    return base + size * (parseFloat(offset) / 100)
  }
  switch (offset) {
    case 'start': return base
    case 'end': return base + size
    case 'center': return base + size / 2
    default: return base
  }
}
