import React from 'react'
import { PackageX } from 'lucide-react'

/**
 * 產品區段空狀態
 */
export const EmptyState = React.memo(() => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <PackageX className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">尚無產品</h3>
      <p className="text-gray-600">目前沒有可顯示的產品，請稍後再查看</p>
    </div>
  )
})

EmptyState.displayName = 'EmptyState'
