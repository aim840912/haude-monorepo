/**
 * 下次市集行程卡片
 * 顯示最近一次即將到來的市集擺攤資訊
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Gift } from 'lucide-react'
import { useUpcomingSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/utils/formatters'

export function NextMarketScheduleCard() {
  const { schedules, isLoading, error } = useUpcomingSchedule()

  // 計算下次行程
  const nextSchedule = useMemo(() => {
    if (!schedules || schedules.length === 0) return null

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // 篩選今日之後的 upcoming 行程
    const upcomingSchedules = schedules.filter((item) => {
      return item.status === 'upcoming' && item.date >= today
    })

    // 按日期時間排序
    const sorted = upcomingSchedules.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })

    return sorted[0] || null
  }, [schedules])

  // Loading 狀態
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg dark:bg-[#2d1f1a]">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-[#d35400] animate-pulse" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-4">下次市集</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-[#5d4037] rounded mx-auto w-48"></div>
          <div className="h-6 bg-gray-200 dark:bg-[#5d4037] rounded mx-auto w-40"></div>
        </div>
      </div>
    )
  }

  // Error 或無資料狀態
  if (error || !nextSchedule) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg dark:bg-[#2d1f1a]">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-gray-400" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-4">下次市集</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error ? '無法載入行程' : '目前沒有即將到來的市集'}
        </p>
        <Link
          to="/schedule"
          className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors"
        >
          查看完整行程
        </Link>
      </div>
    )
  }

  // 格式化顯示
  const scheduleDate = new Date(nextSchedule.date)
  const weekday = scheduleDate.toLocaleDateString('zh-TW', { weekday: 'short' })
  const dateStr = formatDate(nextSchedule.date, 'short')

  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-[#2d1f1a]">
      <div className="flex justify-center mb-4">
        <CalendarDays className="w-12 h-12 text-[#d35400]" strokeWidth={2} />
      </div>
      <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-4">下次市集</h3>
      <div className="text-3xl font-bold text-[#d35400] mb-2">
        {weekday} {nextSchedule.time}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-2">{nextSchedule.location}</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{dateStr}</p>

      {nextSchedule.specialOffer && (
        <div className="bg-[#fff8f0] dark:bg-[#3e2723] rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
          <Gift className="w-4 h-4 text-[#d35400]" strokeWidth={2} />
          <p className="text-sm font-medium text-[#d35400]">{nextSchedule.specialOffer}</p>
        </div>
      )}

      <Link
        to="/schedule"
        className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors"
      >
        查看完整行程
      </Link>
    </div>
  )
}
