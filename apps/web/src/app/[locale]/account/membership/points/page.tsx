'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import {
  ArrowLeft,
  Gift,
  ShoppingBag,
  Cake,
  Minus,
  Settings,
  Clock,
  ChevronDown,
} from 'lucide-react'
import type { PointTransactionType } from '@haude/types'
import { API_URL } from '@/lib/api-url'

interface PointsHistoryItem {
  id: string
  type: PointTransactionType
  points: number
  balance: number
  description: string | null
  createdAt: string
}

interface PointsHistoryResponse {
  items: PointsHistoryItem[]
  total: number
  hasMore: boolean
}

// 交易類型配置
const transactionTypeConfig: Record<
  PointTransactionType,
  {
    name: string
    icon: typeof Gift
    bgColor: string
    iconColor: string
    textColor: string
  }
> = {
  PURCHASE: {
    name: '消費獲得',
    icon: ShoppingBag,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    textColor: 'text-green-600',
  },
  BIRTHDAY: {
    name: '生日獎勵',
    icon: Cake,
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
    textColor: 'text-pink-600',
  },
  REDEMPTION: {
    name: '積分兌換',
    icon: Minus,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    textColor: 'text-orange-600',
  },
  ADJUSTMENT: {
    name: '管理員調整',
    icon: Settings,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-600',
  },
  EXPIRATION: {
    name: '過期扣除',
    icon: Clock,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-500',
    textColor: 'text-gray-500',
  },
}

const PAGE_SIZE = 20

export default function PointsHistoryPage() {
  const router = useRouter()
  const { isAuthenticated, token, user } = useAuthStore()
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [currentPoints, setCurrentPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/membership/points')
    }
  }, [isAuthenticated, router])

  const fetchHistory = useCallback(
    async (offset = 0, append = false) => {
      if (!token) return

      if (offset === 0) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const headers = { Authorization: `Bearer ${token}` }

        // 並行獲取積分餘額和歷史
        const requests =
          offset === 0
            ? [
                fetch(`${API_URL}/members/me/points`, { headers }),
                fetch(
                  `${API_URL}/members/me/points/history?limit=${PAGE_SIZE}&offset=${offset}`,
                  { headers }
                ),
              ]
            : [
                fetch(
                  `${API_URL}/members/me/points/history?limit=${PAGE_SIZE}&offset=${offset}`,
                  { headers }
                ),
              ]

        const responses = await Promise.all(requests)

        // 檢查所有回應
        for (const res of responses) {
          if (!res.ok) throw new Error('無法載入積分資料')
        }

        if (offset === 0) {
          const [balanceRes, historyRes] = responses
          const [balanceData, historyData]: [
            { balance: number },
            PointsHistoryResponse,
          ] = await Promise.all([balanceRes.json(), historyRes.json()])

          setCurrentPoints(balanceData.balance)
          setHistory(historyData.items)
          setHasMore(historyData.hasMore)
        } else {
          const [historyRes] = responses
          const historyData: PointsHistoryResponse = await historyRes.json()

          if (append) {
            setHistory((prev) => [...prev, ...historyData.items])
          } else {
            setHistory(historyData.items)
          }
          setHasMore(historyData.hasMore)
        }
      } catch {
        setError('無法載入積分歷史，請稍後再試')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (token) {
      fetchHistory(0)
    }
  }, [token, fetchHistory])

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchHistory(history.length, true)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 返回按鈕 */}
        <Link
          href="/account/membership"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回會員中心</span>
        </Link>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">積分歷史</h1>

        {/* 積分餘額卡片 */}
        <div className="bg-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-purple-100">可用積分</span>
          </div>
          <p className="text-4xl font-bold">
            {isLoading ? '---' : currentPoints.toLocaleString()}
          </p>
          <p className="text-sm text-purple-200 mt-2">
            積分可用於折抵消費金額（1 點 = NT$ 1）
          </p>
        </div>

        {/* 積分說明 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">積分規則</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <ShoppingBag className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>消費 NT$ 1 = 1 積分（依會員等級有倍率加成）</span>
            </li>
            <li className="flex items-start gap-2">
              <Cake className="w-4 h-4 mt-0.5 text-pink-600 flex-shrink-0" />
              <span>生日當月消費享雙倍積分</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>積分有效期限為獲得後 1 年</span>
            </li>
          </ul>
        </div>

        {/* 歷史紀錄 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">
            交易紀錄
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">尚無積分紀錄</p>
              <p className="text-sm text-gray-400 mt-1">
                開始消費即可累積積分
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {history.map((item) => {
                  const config = transactionTypeConfig[item.type]
                  const Icon = config.icon
                  const isPositive = item.points > 0

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {config.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.createdAt)}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {isPositive ? '+' : ''}
                          {item.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          餘額: {item.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 載入更多 */}
              {hasMore && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-2 text-green-600 hover:text-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                    ) : (
                      <>
                        <span>載入更多</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
