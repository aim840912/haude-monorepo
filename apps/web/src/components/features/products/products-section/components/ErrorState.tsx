import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  /** 錯誤訊息 */
  error: string
  /** 重試回調 */
  onRetry?: () => void
}

/**
 * 產品區段錯誤狀態
 */
export const ErrorState = React.memo<ErrorStateProps>(({ error, onRetry }) => {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重試</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
})

ErrorState.displayName = 'ErrorState'
