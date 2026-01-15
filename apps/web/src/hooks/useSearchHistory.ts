'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'haude-search-history'
const MAX_HISTORY = 10

/**
 * 搜尋歷史 Hook
 * 使用 localStorage 儲存最近的搜尋記錄
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // 從 localStorage 載入歷史記錄
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // 忽略解析錯誤
    }
    setIsLoaded(true)
  }, [])

  // 儲存到 localStorage
  const saveToStorage = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch {
      // 忽略儲存錯誤（可能是 localStorage 已滿）
    }
  }, [])

  /**
   * 新增搜尋記錄
   * 如果已存在，移到最前面
   */
  const addToHistory = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim()
      if (!trimmedQuery) return

      setHistory((prev) => {
        // 移除已存在的相同記錄，然後加到最前面
        const newHistory = [
          trimmedQuery,
          ...prev.filter((h) => h.toLowerCase() !== trimmedQuery.toLowerCase()),
        ].slice(0, MAX_HISTORY)

        saveToStorage(newHistory)
        return newHistory
      })
    },
    [saveToStorage]
  )

  /**
   * 從歷史記錄中移除特定項目
   */
  const removeFromHistory = useCallback(
    (query: string) => {
      setHistory((prev) => {
        const newHistory = prev.filter((h) => h !== query)
        saveToStorage(newHistory)
        return newHistory
      })
    },
    [saveToStorage]
  )

  /**
   * 清除所有歷史記錄
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 忽略錯誤
    }
  }, [])

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
