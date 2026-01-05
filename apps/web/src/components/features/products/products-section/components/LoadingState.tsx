import React from 'react'

/**
 * 產品區段載入狀態
 */
export const LoadingState = React.memo(() => {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* 標題骨架 */}
        <div className="text-center mb-16">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-80 bg-gray-100 rounded mx-auto animate-pulse" />
        </div>

        {/* 產品卡片骨架 */}
        <div className="flex flex-wrap justify-center gap-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-sm"
            >
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

LoadingState.displayName = 'LoadingState'
