'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// ==========================================
// 類型定義
// ==========================================

export type Theme = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: EffectiveTheme
  setTheme: (theme: Theme) => void
  isClient: boolean
}

// ==========================================
// Storage 工具
// ==========================================

const THEME_STORAGE_KEY = 'haude-theme'

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'light'
}

const saveTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

// ==========================================
// Context
// ==========================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme Provider
 * 提供主題切換功能，支援 light / dark 兩種模式
 *
 * 功能特色：
 * - 支援兩種主題模式（light / dark）
 * - 不受系統偏好影響，完全由用戶控制
 * - 持久化到 localStorage
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light')
  const [isClient, setIsClient] = useState(false)

  // 從 localStorage 載入主題偏好（這是初始化狀態的標準模式）
  
  useEffect(() => {
    setIsClient(true)
    const savedTheme = getStoredTheme()
    setThemeState(savedTheme)
  }, [])
  

  // 解析實際應用的主題（響應 theme 變化計算派生狀態）
  
  useEffect(() => {
    if (!isClient) return

    /**
     * 解析主題：將 system 轉換為 light（不再依賴系統偏好）
     */
    const resolveTheme = (currentTheme: Theme): EffectiveTheme => {
      if (currentTheme === 'system' || currentTheme === 'light') {
        return 'light'
      }
      return 'dark'
    }

    const resolved = resolveTheme(theme)
    setEffectiveTheme(resolved)

    // 更新 HTML class for Tailwind dark mode
    const html = document.documentElement
    if (resolved === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [theme, isClient])
  

  /**
   * 切換主題並儲存到 localStorage
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, isClient }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 * 用於在元件中存取主題相關功能
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme 必須在 ThemeProvider 內使用')
  }
  return context
}
