import { Calendar, MapPin, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpcomingSchedule } from '@/hooks/useSchedule'
import type { ScheduleItem } from '@/types/schedule'

interface UpcomingScheduleProps {
  /** 最大顯示數量 */
  limit?: number
  /** 自訂類名 */
  className?: string
  /** 點擊項目時的回調 */
  onItemClick?: (item: ScheduleItem) => void
}

/**
 * 即將到來的日程列表元件
 */
export function UpcomingSchedule({ limit = 5, className, onItemClick }: UpcomingScheduleProps) {
  const { schedules, isLoading, error, refetch } = useUpcomingSchedule()

  const displaySchedules = limit ? schedules.slice(0, limit) : schedules

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm mb-2">{error}</p>
        <button
          onClick={refetch}
          className="text-sm text-green-600 hover:underline"
        >
          重試
        </button>
      </div>
    )
  }

  if (displaySchedules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">近期沒有安排的活動</p>
      </div>
    )
  }

  // 格式化日期顯示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
    return { month, day, weekDay }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displaySchedules.map(item => {
        const { month, day, weekDay } = formatDate(item.date)

        return (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className={cn(
              'flex gap-4 p-4 bg-white rounded-lg border border-gray-200',
              'hover:border-green-300 hover:shadow-sm transition-all',
              onItemClick && 'cursor-pointer'
            )}
          >
            {/* 日期區塊 */}
            <div className="flex-shrink-0 w-14 text-center">
              <div className="text-xs text-gray-500">{month}月</div>
              <div className="text-2xl font-bold text-green-700">{day}</div>
              <div className="text-xs text-gray-500">週{weekDay}</div>
            </div>

            {/* 內容區塊 */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
              <div className="mt-1 space-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>

              {/* 特別優惠 */}
              {item.specialOffer && (
                <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                  {item.specialOffer}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
