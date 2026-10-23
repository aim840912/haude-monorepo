'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  /** Header colour classes (iconBtn), so the button follows the transparent / solid nav state */
  className?: string
}

/**
 * 深淺色模式切換按鈕
 *
 * - 圖示表示「按下去會切成什麼」：淺色時顯示月亮，深色時顯示太陽
 * - 掛載前（isClient=false）只渲染同尺寸的空按鈕，避免伺服器與瀏覽器渲染不一致
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { effectiveTheme, setTheme, isClient } = useTheme()
  const isDark = effectiveTheme === 'dark'
  const label = isDark ? '切換為淺色模式' : '切換為深色模式'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center justify-center rounded-md transition-colors duration-200',
        className
      )}
      aria-label={isClient ? label : '切換深淺色模式'}
      title={isClient ? label : undefined}
    >
      {isClient &&
        (isDark ? (
          <Sun className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Moon className="w-5 h-5" aria-hidden="true" />
        ))}
    </button>
  )
}
