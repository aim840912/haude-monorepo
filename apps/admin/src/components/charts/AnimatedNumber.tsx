import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  formatter?: (value: number) => string
}

/**
 * 數字動畫元件
 * 使用 CSS transition 實現平滑的數字變化效果
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = '',
  formatter = (v) => v.toLocaleString(),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startValue = useRef(0)
  const startTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)

  useEffect(() => {
    startValue.current = displayValue
    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp
      }

      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)

      // 使用 easeOutExpo 緩動函數
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const current = startValue.current + (value - startValue.current) * easeProgress
      setDisplayValue(Math.round(current))

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {formatter(displayValue)}
      {suffix}
    </span>
  )
}
