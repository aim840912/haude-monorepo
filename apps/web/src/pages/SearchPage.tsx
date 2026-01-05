import { useSearchParams } from 'react-router-dom'
import { SearchBar, SearchResults } from '@/components/features/search'

/**
 * 搜尋結果頁
 *
 * 功能：
 * - 顯示搜尋結果
 * - 支援篩選和排序
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題與搜尋列 */}
      <div className="bg-green-600 text-white py-[1.28rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-6">搜尋</h1>
          <SearchBar
            initialValue={query}
            onSearch={handleSearch}
            placeholder="搜尋產品、體驗活動、地點..."
            className="max-w-2xl"
          />
        </div>
      </div>

      {/* 搜尋結果 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchResults query={query} />
      </div>
    </div>
  )
}
