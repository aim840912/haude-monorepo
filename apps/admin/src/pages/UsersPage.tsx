import { useState, useMemo } from 'react'
import { Search, RefreshCw, Crown, Award, Star, Coins, ChevronRight } from 'lucide-react'
import { useMembers } from '../hooks/useMembers'
import { MemberLevel } from '../services/api'
import { useNavigate } from 'react-router-dom'

// 會員等級設定
const MEMBER_LEVEL_CONFIG: Record<MemberLevel, {
  displayName: string
  icon: typeof Crown
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  NORMAL: {
    displayName: '普通會員',
    icon: Star,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
  BRONZE: {
    displayName: '銅卡會員',
    icon: Award,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  SILVER: {
    displayName: '銀卡會員',
    icon: Award,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
  },
  GOLD: {
    displayName: '金卡會員',
    icon: Crown,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
  },
}

export function UsersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<MemberLevel | ''>('')

  const { members, total, isLoading, error, refetch } = useMembers({
    level: levelFilter || undefined,
    search: searchQuery || undefined,
  })

  // 過濾會員（本地再次過濾以確保即時響應）
  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [members, searchQuery])

  // 計算等級統計
  const levelStats = useMemo(() => {
    const stats = {
      NORMAL: 0,
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
    }
    members.forEach((member) => {
      stats[member.memberLevel]++
    })
    return stats
  }, [members])

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return `NT$${amount.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">會員管理</h1>
        <button
          onClick={refetch}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards - 會員等級分布 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(Object.keys(MEMBER_LEVEL_CONFIG) as MemberLevel[]).map((level) => {
          const config = MEMBER_LEVEL_CONFIG[level]
          const Icon = config.icon
          const isSelected = levelFilter === level

          return (
            <button
              key={level}
              onClick={() => setLevelFilter(isSelected ? '' : level)}
              className={`bg-white rounded-xl shadow-sm p-4 text-left transition-[box-shadow,outline] ${
                isSelected ? `ring-2 ring-green-500 ${config.borderColor}` : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${config.bgColor} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${config.textColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{config.displayName}</p>
                  <p className="text-xl font-bold text-gray-900">{levelStats[level]}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋會員名稱或信箱..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {levelFilter && (
            <button
              onClick={() => setLevelFilter('')}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || levelFilter ? '找不到符合的會員' : '尚無會員'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    會員資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    會員等級
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    累積消費
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    積分餘額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    註冊時間
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const levelConfig = MEMBER_LEVEL_CONFIG[member.memberLevel]
                  const LevelIcon = levelConfig.icon

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/users/${member.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${levelConfig.bgColor} ${levelConfig.textColor}`}
                        >
                          <LevelIcon className="w-3.5 h-3.5" />
                          {levelConfig.displayName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(member.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">
                            {member.currentPoints.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(member.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/users/${member.id}`)
                          }}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="查看詳情"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 會員數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {total} 位會員
        {(searchQuery || levelFilter) && ` (顯示 ${filteredMembers.length} 位)`}
      </div>
    </div>
  )
}
