import { useState, useEffect, useRef } from 'react'

/**
 * 可見性偵測 Hook (Intersection Observer)
 *
 * 當元素進入視窗時觸發 isVisible 為 true
 * 用於觸發進場動畫效果
 */
export function useVisibility() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { isVisible, ref }
}
