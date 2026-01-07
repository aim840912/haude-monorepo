import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScheduleCalendar } from '@/hooks/useSchedule'
import type { ScheduleItem } from '@/types/schedule'

interface ScheduleCalendarProps {
  /** 自訂類名 */
  className?: string
  /** 日期點擊事件 */
  onDateClick?: (date: string, events: ScheduleItem[]) => void
}

/**
 * 日程日曆元件
 */
export function ScheduleCalendar({ className, onDateClick }: ScheduleCalendarProps) {
  const {
    schedules,
    isLoading,
    currentMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
  } = useScheduleCalendar()

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]

  // 取得該月的日期資料
  const getDaysInMonth = () => {
    const year = currentMonth.year
    const month = currentMonth.month - 1 // JavaScript month is 0-indexed
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = []

    // 填充上個月的日期
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1)
      days.push({
        date: prevMonthDay.toISOString().split('T')[0],
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        isToday: false,
        events: [] as ScheduleItem[],
      })
    }

    // 填充當月日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      // 後端返回的日期可能是 ISO 格式 (2025-01-07T00:00:00.000Z)，需要截取日期部分比對
      const dayEvents = schedules.filter(s => {
        const scheduleDate = typeof s.date === 'string'
          ? s.date.split('T')[0]  // 處理 ISO 格式
          : new Date(s.date).toISOString().split('T')[0]
        return scheduleDate === dateStr
      })

      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents,
      })
    }

    // 填充下個月的日期
    const remainingDays = 42 - days.length // 6 rows x 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i)
      days.push({
        date: nextMonthDay.toISOString().split('T')[0],
        day: i,
        isCurrentMonth: false,
        isToday: false,
        events: [] as ScheduleItem[],
      })
    }

    return days
  }

  const days = getDaysInMonth()

  return (
    <div className={cn('bg-white rounded-xl shadow-lg p-6', className)}>
      {/* 月份導航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="上個月"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {currentMonth.year} 年 {monthNames[currentMonth.month - 1]}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm text-green-600 hover:underline mt-1"
          >
            返回今天
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="下個月"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => onDateClick?.(day.date, day.events)}
                disabled={!day.isCurrentMonth}
                className={cn(
                  'relative aspect-square p-1 rounded-lg text-sm transition-colors',
                  day.isCurrentMonth
                    ? 'hover:bg-gray-100'
                    : 'text-gray-300 cursor-default',
                  day.isToday && 'bg-green-100 font-bold',
                  day.events.length > 0 && day.isCurrentMonth && 'bg-green-50'
                )}
              >
                <span className={cn(day.isToday && 'text-green-700')}>
                  {day.day}
                </span>

                {/* 事件指示器 */}
                {day.events.length > 0 && day.isCurrentMonth && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {day.events.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-green-500"
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 圖例 */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span>今天</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>有活動</span>
        </div>
      </div>
    </div>
  )
}
