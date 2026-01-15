import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Crown,
  Award,
  Star,
  Coins,
  TrendingUp,
  History,
  Edit,
  ShoppingBag,
  Cake,
  Minus,
  Settings,
  Clock,
} from 'lucide-react'
import { useMemberDetail } from '../hooks/useMembers'
import { membersApi, MemberLevel } from '../services/api'

// 會員等級設定
const MEMBER_LEVEL_CONFIG: Record<MemberLevel, {
  displayName: string
  icon: typeof Crown
  bgColor: string
  textColor: string
  borderColor: string
  discountPercent: number
}> = {
  NORMAL: {
    displayName: '普通會員',
    icon: Star,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    discountPercent: 0,
  },
  BRONZE: {
    displayName: '銅卡會員',
    icon: Award,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    discountPercent: 5,
  },
  SILVER: {
    displayName: '銀卡會員',
    icon: Award,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    discountPercent: 10,
  },
  GOLD: {
    displayName: '金卡會員',
    icon: Crown,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    discountPercent: 15,
  },
}

// 積分交易類型設定
const POINT_TYPE_CONFIG = {
  PURCHASE: { name: '消費獲得', icon: ShoppingBag, color: 'text-green-600', bgColor: 'bg-green-100' },
  BIRTHDAY: { name: '生日獎勵', icon: Cake, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  REDEMPTION: { name: '積分兌換', icon: Minus, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ADJUSTMENT: { name: '管理員調整', icon: Settings, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  EXPIRATION: { name: '過期扣除', icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    member,
    levelHistory,
    pointsHistory,
    isLoading,
    error,
    refetch,
    loadMoreLevelHistory,
    loadMorePointsHistory,
    hasMoreLevelHistory,
    hasMorePointsHistory,
  } = useMemberDetail(id)

  // 調整等級 Modal 狀態
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [newLevel, setNewLevel] = useState<MemberLevel>('NORMAL')
  const [levelReason, setLevelReason] = useState('')
  const [isAdjustingLevel, setIsAdjustingLevel] = useState(false)

  // 調整積分 Modal 狀態
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [pointsAmount, setPointsAmount] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false)

  // 格式化金額
  const formatCurrency = (amount: number) => `NT$${amount.toLocaleString()}`

  // 調整等級
  const handleAdjustLevel = async () => {
    if (!id) return

    setIsAdjustingLevel(true)
    try {
      await membersApi.adjustLevel(id, {
        level: newLevel,
        reason: levelReason || undefined,
      })
      setShowLevelModal(false)
      setLevelReason('')
      refetch()
    } catch (err) {
      console.error('調整等級失敗', err)
    } finally {
      setIsAdjustingLevel(false)
    }
  }

  // 調整積分
  const handleAdjustPoints = async () => {
    if (!id || !pointsAmount) return

    setIsAdjustingPoints(true)
    try {
      await membersApi.adjustPoints(id, {
        points: parseInt(pointsAmount, 10),
        reason: pointsReason || undefined,
      })
      setShowPointsModal(false)
      setPointsAmount('')
      setPointsReason('')
      refetch()
    } catch (err) {
      console.error('調整積分失敗', err)
    } finally {
      setIsAdjustingPoints(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error || '會員不存在'}</p>
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
      </div>
    )
  }

  const levelConfig = MEMBER_LEVEL_CONFIG[member.memberLevel]
  const LevelIcon = levelConfig.icon

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/users')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <p className="text-gray-500">{member.email}</p>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Member Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 會員等級卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">會員等級</h2>
            <button
              onClick={() => {
                setNewLevel(member.memberLevel)
                setShowLevelModal(true)
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`p-3 ${levelConfig.bgColor} rounded-xl`}>
              <LevelIcon className={`w-8 h-8 ${levelConfig.textColor}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${levelConfig.textColor}`}>
                {levelConfig.displayName}
              </p>
              <p className="text-sm text-gray-500">
                {levelConfig.discountPercent > 0 ? `${levelConfig.discountPercent}% 折扣` : '無折扣'}
              </p>
            </div>
          </div>
          {member.levelConfig && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">積分倍率</p>
                  <p className="font-medium">{member.levelConfig.pointMultiplier}x</p>
                </div>
                <div>
                  <p className="text-gray-500">免運費</p>
                  <p className="font-medium">{member.levelConfig.freeShipping ? '是' : '否'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 累積消費卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">累積消費</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(member.totalSpent)}
              </p>
              <p className="text-sm text-gray-500">總累積金額</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              註冊日期: {new Date(member.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>

        {/* 積分餘額卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">積分餘額</h2>
            <button
              onClick={() => setShowPointsModal(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Coins className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {member.currentPoints.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">可用積分</p>
            </div>
          </div>
          {member.birthday && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                生日: {new Date(member.birthday).toLocaleDateString('zh-TW')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 等級變更歷史 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">等級變更歷史</h2>
          </div>
          {levelHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">尚無等級變更記錄</p>
          ) : (
            <div className="space-y-3">
              {levelHistory.map((item) => {
                const fromConfig = MEMBER_LEVEL_CONFIG[item.fromLevel]
                const toConfig = MEMBER_LEVEL_CONFIG[item.toLevel]

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${fromConfig.bgColor} ${fromConfig.textColor}`}>
                        {fromConfig.displayName}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${toConfig.bgColor} ${toConfig.textColor}`}>
                        {toConfig.displayName}
                      </span>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-500">{item.reason}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                )
              })}
              {hasMoreLevelHistory && (
                <button
                  onClick={loadMoreLevelHistory}
                  className="w-full py-2 text-sm text-gray-600 hover:text-green-600"
                >
                  載入更多
                </button>
              )}
            </div>
          )}
        </div>

        {/* 積分交易歷史 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">積分交易歷史</h2>
          </div>
          {pointsHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">尚無積分交易記錄</p>
          ) : (
            <div className="space-y-3">
              {pointsHistory.map((item) => {
                const typeConfig = POINT_TYPE_CONFIG[item.type]
                const TypeIcon = typeConfig.icon
                const isPositive = item.points > 0

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 ${typeConfig.bgColor} rounded-lg`}>
                      <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{typeConfig.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.description || new Date(item.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{item.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">餘額: {item.balance.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
              {hasMorePointsHistory && (
                <button
                  onClick={loadMorePointsHistory}
                  className="w-full py-2 text-sm text-gray-600 hover:text-green-600"
                >
                  載入更多
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 調整等級 Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">調整會員等級</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新等級
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as MemberLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {(Object.keys(MEMBER_LEVEL_CONFIG) as MemberLevel[]).map((level) => (
                    <option key={level} value={level}>
                      {MEMBER_LEVEL_CONFIG[level].displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  調整原因（選填）
                </label>
                <input
                  type="text"
                  value={levelReason}
                  onChange={(e) => setLevelReason(e.target.value)}
                  placeholder="例如：VIP 客戶特殊升級"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLevelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdjustLevel}
                disabled={isAdjustingLevel}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isAdjustingLevel ? '處理中...' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 調整積分 Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">調整會員積分</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  調整數量（正數增加，負數扣除）
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  placeholder="例如：100 或 -50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  調整原因（選填）
                </label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="例如：客訴補償"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  當前積分: <span className="font-semibold">{member.currentPoints.toLocaleString()}</span>
                </p>
                {pointsAmount && (
                  <p className="text-sm text-gray-600">
                    調整後: <span className="font-semibold">
                      {(member.currentPoints + parseInt(pointsAmount || '0', 10)).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPointsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdjustPoints}
                disabled={isAdjustingPoints || !pointsAmount}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isAdjustingPoints ? '處理中...' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
