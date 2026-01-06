import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 數字 */}
        <h1 className="text-9xl font-bold text-green-600">404</h1>

        {/* 錯誤訊息 */}
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">
          找不到頁面
        </h2>
        <p className="mt-2 text-gray-500">
          抱歉，您要找的頁面不存在或已被移除。
        </p>

        {/* 返回按鈕 */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            返回首頁
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            瀏覽產品
          </Link>
        </div>
      </div>
    </div>
  )
}
