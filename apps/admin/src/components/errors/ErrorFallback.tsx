import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
}

/**
 * 錯誤 Fallback UI（Admin 版本）
 *
 * 使用 React Router 的 Link 而非 Next.js 的 Link
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 圖示 */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* 標題 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          發生錯誤
        </h2>

        {/* 描述 */}
        <p className="text-gray-600 mb-6">
          很抱歉，頁面載入時發生問題。請嘗試重新整理或返回首頁。
        </p>

        {/* 開發模式顯示錯誤詳情 */}
        {isDev && error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-red-600 break-all">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重試
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
