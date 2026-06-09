'use client'

/**
 * 下次市集行程卡片 — 方向 A
 *
 * 與原版差異：
 * - 由置中白卡改為深茶褐主面板（左對齊），日期用金色襯線放大，作為「最新消息」區的主角
 * - 全面移除 off-brand 橘 #d35400 → 品牌金 #d4af37
 * - 圓角收斂、移除厚陰影
 *
 * 介面 / 資料邏輯與原版完全相同，可直接替換。
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, Gift } from 'lucide-react'
import { useUpcomingSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/utils/formatters'

const PANEL = 'h-full bg-[#3e2723] text-[#f5efe8] rounded-lg p-10 flex flex-col justify-center'

export function NextMarketScheduleCard() {
  const { schedules, isLoading, error } = useUpcomingSchedule()

  const nextSchedule = useMemo(() => {
    if (!schedules || schedules.length === 0) return null
    const today = new Date().toISOString().split('T')[0]
    const upcoming = schedules.filter((item) => item.status === 'upcoming' && item.date >= today)
    const sorted = upcoming.sort((a, b) => {
      const ta = new Date(`${a.date}T${a.time}`).getTime()
      const tb = new Date(`${b.date}T${b.time}`).getTime()
      return ta - tb
    })
    return sorted[0] || null
  }, [schedules])

  // Loading
  if (isLoading) {
    return (
      <div className={PANEL}>
        <p className="text-xs tracking-[0.3em] uppercase text-[#d4af37] mb-5">
          下次市集 · Next Market
        </p>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-white/10 rounded w-56" />
          <div className="h-5 bg-white/10 rounded w-40" />
        </div>
      </div>
    )
  }

  // Error / 無資料
  if (error || !nextSchedule) {
    return (
      <div className={PANEL}>
        <p className="text-xs tracking-[0.3em] uppercase text-[#d4af37] mb-5">
          下次市集 · Next Market
        </p>
        <div className="flex items-center gap-3 mb-4 text-[#f5efe8]/85">
          <CalendarDays className="w-7 h-7 text-[#d4af37]" strokeWidth={1.6} />
          <span className="text-lg">{error ? '無法載入行程' : '目前沒有即將到來的市集'}</span>
        </div>
        <Link
          href="/schedule"
          className="self-start text-[#d4af37] border-b border-[#d4af37]/50 pb-0.5 hover:text-[#ffd54f] transition-colors"
        >
          查看完整擺攤行程 &rarr;
        </Link>
      </div>
    )
  }

  // 正常
  const scheduleDate = new Date(nextSchedule.date)
  const weekday = scheduleDate.toLocaleDateString('zh-TW', { weekday: 'short' })
  const dateStr = formatDate(nextSchedule.date, 'short')

  return (
    <div className={PANEL}>
      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="w-5 h-5 text-[#d4af37]" strokeWidth={1.6} />
        <p className="text-xs tracking-[0.3em] uppercase text-[#d4af37]">下次市集 · Next Market</p>
      </div>

      <div className="font-serif text-4xl md:text-5xl font-bold text-[#fdf6ec] leading-tight mb-2">
        {weekday} {nextSchedule.time}
      </div>
      <p className="text-lg text-[#f5efe8]/85 mb-1">{nextSchedule.location}</p>
      <p className="text-sm text-[#f5efe8]/55 mb-7">{dateStr}</p>

      {nextSchedule.specialOffer && (
        <div className="inline-flex items-center gap-2 self-start border border-[#d4af37]/45 text-[#d4af37] text-sm px-3.5 py-2 rounded-sm mb-7">
          <Gift className="w-4 h-4" strokeWidth={1.8} />
          <span>{nextSchedule.specialOffer}</span>
        </div>
      )}

      <Link
        href="/schedule"
        className="self-start text-[#d4af37] border-b border-[#d4af37]/50 pb-0.5 hover:text-[#ffd54f] transition-colors"
      >
        查看完整擺攤行程 &rarr;
      </Link>
    </div>
  )
}
