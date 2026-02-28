'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { ArrowLeft, Crown, Star, Award, Gift, Truck, Percent, ChevronRight } from 'lucide-react'
import type { MemberLevelInfo, UpgradeProgress, MemberLevelConfig } from '@haude/types'
import { api } from '@/services/api'

// 等級顯示設定
const levelConfig: Record<string, {
  name: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Crown
}> = {
  NORMAL: {
    name: '普通會員',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: Star,
  },
  BRONZE: {
    name: '銅卡會員',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Award,
  },
  SILVER: {
    name: '銀卡會員',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: Award,
  },
  GOLD: {
    name: '金卡會員',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: Crown,
  },
}

export default function MembershipPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [levelInfo, setLevelInfo] = useState<MemberLevelInfo | null>(null)
  const [upgradeProgress, setUpgradeProgress] = useState<UpgradeProgress | null>(null)
  const [levelConfigs, setLevelConfigs] = useState<MemberLevelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/membership')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchMembershipData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Parallel fetch membership info (httpOnly cookies sent automatically)
        const [levelRes, progressRes, configsRes] = await Promise.all([
          api.get<MemberLevelInfo>('/members/me/level'),
          api.get<UpgradeProgress>('/members/me/upgrade-progress'),
          api.get<MemberLevelConfig[]>('/members/level-configs'),
        ])

        setLevelInfo(levelRes.data)
        setUpgradeProgress(progressRes.data)
        setLevelConfigs(configsRes.data)
      } catch {
        setError('無法載入會員資訊，請稍後再試')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembershipData()
  }, [isAuthenticated])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  const currentLevel = levelInfo?.level || user.memberLevel || 'NORMAL'
  const config = levelConfig[currentLevel]
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 返回按鈕 */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回帳戶</span>
        </Link>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">會員等級</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
        ) : (
          <>
            {/* 會員等級卡片 */}
            <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-6 mb-6`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${config.color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${config.color}`}>{config.name}</p>
                  <p className="text-sm text-gray-500">{user.name}</p>
                </div>
              </div>

              {/* 等級權益 */}
              {levelInfo && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white/70 rounded-xl p-3 text-center">
                    <Percent className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-xs text-gray-500">折扣</p>
                    <p className="font-bold text-gray-900">
                      {levelInfo.discountPercent > 0 ? `${100 - levelInfo.discountPercent}折` : '無'}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 text-center">
                    <Truck className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-gray-500">免運費</p>
                    <p className="font-bold text-gray-900">
                      {levelInfo.freeShipping ? '是' : '否'}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 text-center">
                    <Gift className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-gray-500">積分倍率</p>
                    <p className="font-bold text-gray-900">{levelInfo.pointMultiplier}x</p>
                  </div>
                </div>
              )}
            </div>

            {/* 消費與積分統計 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">消費統計</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">累積消費</p>
                  <p className="text-xl font-bold text-gray-900">
                    NT$ {(levelInfo?.totalSpent ?? user.totalSpent ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">可用積分</p>
                  <p className="text-xl font-bold text-green-600">
                    {(levelInfo?.currentPoints ?? user.currentPoints ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* 升級進度 */}
            {upgradeProgress && upgradeProgress.nextLevel && (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-4">升級進度</h2>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      距離 {upgradeProgress.nextLevelName}
                    </span>
                    <span className="font-medium text-gray-900">
                      {upgradeProgress.progressPercent}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-[width] duration-500"
                      style={{ width: `${upgradeProgress.progressPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  再消費 <span className="font-bold text-green-600">
                    NT$ {(upgradeProgress.amountToNextLevel ?? 0).toLocaleString()}
                  </span> 即可升級至 {upgradeProgress.nextLevelName}
                </p>
              </div>
            )}

            {/* 已達最高等級 */}
            {upgradeProgress && !upgradeProgress.nextLevel && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6 text-center">
                <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                <p className="font-bold text-yellow-800">恭喜您已達最高等級！</p>
                <p className="text-sm text-yellow-700 mt-1">
                  尊享所有會員專屬優惠
                </p>
              </div>
            )}

            {/* 等級權益說明 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">
                等級權益一覽
              </h2>
              {levelConfigs.map((lvl, index) => {
                const lvlConfig = levelConfig[lvl.level]
                const LvlIcon = lvlConfig.icon
                const isCurrent = lvl.level === currentLevel

                return (
                  <div
                    key={lvl.id}
                    className={`flex items-center justify-between p-4 ${
                      index !== levelConfigs.length - 1 ? 'border-b border-gray-100' : ''
                    } ${isCurrent ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${lvlConfig.bgColor} flex items-center justify-center`}>
                        <LvlIcon className={`w-5 h-5 ${lvlConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isCurrent ? 'text-green-700' : 'text-gray-900'}`}>
                            {lvl.displayName}
                          </p>
                          {isCurrent && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              目前等級
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          累積消費 NT$ {lvl.minSpent.toLocaleString()} 以上
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {lvl.discountPercent > 0 && (
                        <p className="text-green-600 font-medium">
                          {100 - lvl.discountPercent}折優惠
                        </p>
                      )}
                      {lvl.freeShipping && (
                        <p className="text-blue-600 text-xs">免運費</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 積分歷史入口 */}
            <Link
              href="/account/membership/points"
              className="mt-6 bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">積分歷史</p>
                  <p className="text-sm text-gray-500">查看積分獲取與使用記錄</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
