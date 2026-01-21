'use client'

import { Wrench, Clock, RefreshCw } from 'lucide-react'
import type { MaintenanceStatus } from '@haude/types'

interface MaintenancePageProps {
  maintenance: MaintenanceStatus
  onRefresh?: () => void
}

/**
 * 維護頁面
 *
 * 當系統處於維護模式時顯示
 * 展示維護訊息和預計恢復時間
 */
export function MaintenancePage({ maintenance, onRefresh }: MaintenancePageProps) {
  const formatEstimatedTime = (isoString?: string): string | null => {
    if (!isoString) return null

    try {
      const date = new Date(isoString)
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }

  const estimatedTime = formatEstimatedTime(maintenance.estimatedEndTime)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* 動畫圖示 */}
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20 mb-8 animate-pulse">
          <Wrench className="w-12 h-12 text-purple-600 dark:text-purple-400" />
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          系統維護中
        </h1>

        {/* 維護訊息 */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {maintenance.message || '我們正在進行系統維護，請稍後再試。'}
        </p>

        {/* 預計恢復時間 */}
        {estimatedTime && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              預計恢復時間：{estimatedTime}
            </span>
          </div>
        )}

        {/* 重新整理按鈕 */}
        <button
          onClick={onRefresh || (() => window.location.reload())}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重新整理
        </button>

        {/* 底部說明 */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          如有緊急問題，請聯繫客服
        </p>
      </div>
    </div>
  )
}
