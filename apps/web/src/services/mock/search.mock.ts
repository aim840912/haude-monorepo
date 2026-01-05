import type { SearchResult, SearchResponse, SearchParams } from '@/types/search'

// Mock 搜尋資料
const mockSearchData: SearchResult[] = [
  {
    id: 'prod-1',
    title: '有機蜂蜜',
    description: '純天然有機蜂蜜，來自台灣高山地區的野生蜂巢',
    type: 'product',
    url: '/products/prod-1',
    category: '蜂蜜',
    image: '/images/honey.jpg',
    price: 580,
    rating: 4.8,
    relevanceScore: 0.95,
  },
  {
    id: 'prod-2',
    title: '龍眼蜜',
    description: '台南東山龍眼蜜，口感濃郁，香氣撲鼻',
    type: 'product',
    url: '/products/prod-2',
    category: '蜂蜜',
    image: '/images/longan-honey.jpg',
    price: 450,
    rating: 4.6,
    relevanceScore: 0.88,
  },
  {
    id: 'prod-3',
    title: '蜂蜜禮盒',
    description: '精選三款蜂蜜組合，送禮自用兩相宜',
    type: 'product',
    url: '/products/prod-3',
    category: '禮盒',
    image: '/images/gift-box.jpg',
    price: 1280,
    rating: 4.9,
    relevanceScore: 0.85,
  },
  {
    id: 'tour-1',
    title: '春季蜜蜂生態體驗',
    description: '認識蜜蜂生態，體驗採蜜樂趣',
    type: 'farmTour',
    url: '/farm-tours/tour-1',
    category: '體驗活動',
    image: '/images/bee-tour.jpg',
    relevanceScore: 0.75,
  },
  {
    id: 'loc-1',
    title: '大湖蜂場',
    description: '位於苗栗大湖的有機養蜂場，提供導覽服務',
    type: 'location',
    url: '/locations/loc-1',
    category: '蜂場',
    relevanceScore: 0.7,
  },
]

// 模擬搜尋延遲
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 搜尋函數
export async function searchContent(params: SearchParams): Promise<SearchResponse> {
  await delay(300) // 模擬網路延遲

  const startTime = Date.now()
  const query = params.q.toLowerCase().trim()

  if (!query) {
    return {
      results: [],
      total: 0,
      query: params.q,
      processingTime: Date.now() - startTime,
    }
  }

  // 搜尋邏輯
  const results = mockSearchData.filter(item => {
    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)

    // 類型篩選
    if (params.filters?.type && params.filters.type.length > 0) {
      if (!params.filters.type.includes(item.type)) return false
    }

    // 類別篩選
    if (params.filters?.category && params.filters.category.length > 0) {
      if (!item.category || !params.filters.category.includes(item.category)) return false
    }

    // 價格範圍篩選
    if (params.filters?.priceRange && item.price) {
      const [min, max] = params.filters.priceRange
      if (item.price < min || item.price > max) return false
    }

    // 最低評分篩選
    if (params.filters?.minRating && item.rating) {
      if (item.rating < params.filters.minRating) return false
    }

    return matchesQuery
  })

  // 按相關性排序
  results.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // 分頁
  const offset = params.offset || 0
  const limit = params.limit || 10
  const paginatedResults = results.slice(offset, offset + limit)

  return {
    results: paginatedResults,
    total: results.length,
    query: params.q,
    processingTime: Date.now() - startTime,
  }
}

// 搜尋建議（前綴匹配）
export async function getSearchSuggestions(query: string): Promise<string[]> {
  await delay(100) // 快速響應

  if (!query.trim()) return []

  const lowerQuery = query.toLowerCase()

  // 從所有項目中提取可能的建議
  const suggestions = new Set<string>()

  mockSearchData.forEach(item => {
    if (item.title.toLowerCase().includes(lowerQuery)) {
      suggestions.add(item.title)
    }
    if (item.category?.toLowerCase().includes(lowerQuery)) {
      suggestions.add(item.category)
    }
  })

  // 添加一些常用搜尋詞
  const commonTerms = ['蜂蜜', '有機', '禮盒', '龍眼蜜', '蜂場體驗', '農場導覽']
  commonTerms.forEach(term => {
    if (term.toLowerCase().includes(lowerQuery)) {
      suggestions.add(term)
    }
  })

  return Array.from(suggestions).slice(0, 5)
}

// API 物件導出
export const searchApi = {
  search: searchContent,
  getSuggestions: getSearchSuggestions,
}
