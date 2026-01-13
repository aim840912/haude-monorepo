/**
 * 產品詳情頁載入骨架
 *
 * 當 Server Component 正在獲取資料時顯示此骨架屏，
 * 提供視覺反饋避免「卡住」的感覺
 */
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航骨架 */}
      <div className="bg-white border-b sticky top-[var(--header-height)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* 主要內容骨架 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左側：圖片骨架 */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            {/* 縮圖骨架 */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* 右側：產品資訊骨架 */}
          <div className="space-y-6">
            {/* 類別 */}
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />

            {/* 名稱 */}
            <div className="h-9 w-3/4 bg-gray-200 rounded animate-pulse" />

            {/* 價格 */}
            <div className="flex items-baseline gap-4">
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 庫存 */}
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />

            {/* 描述 */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 數量選擇 */}
            <div className="flex items-center gap-4">
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* 購買按鈕 */}
            <div className="h-14 w-full bg-gray-200 rounded-lg animate-pulse" />

            {/* 服務保證 */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-6 h-6 bg-gray-200 rounded-full mb-2 animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 評論區骨架 */}
        <div className="mt-12 pt-8 border-t">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
