'use client'

import { useState } from 'react'
import { ScheduleCalendar, UpcomingSchedule } from '@/components/features/calendar'
import { Breadcrumb } from '@/components/ui/navigation'
import type { ScheduleItem } from '@/types/schedule'

/**
 * 日程頁面
 *
 * 功能：
 * - 日曆檢視
 * - 即將到來的活動列表
 */
export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<ScheduleItem[]>([])

  const handleDateClick = (date: string, events: ScheduleItem[]) => {
    setSelectedDate(date)
    setSelectedEvents(events)
  }

  const handleEventClick = (_event: ScheduleItem) => {
    // TODO: 導航到活動詳情或顯示 Modal
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: '活動日程' }]} className="mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 日曆 */}
          <div className="lg:col-span-2">
            <ScheduleCalendar onDateClick={handleDateClick} />

            {/* 選中日期的活動 */}
            {selectedDate && selectedEvents.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedDate} 的活動
                </h3>
                <div className="space-y-3">
                  {selectedEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-4 bg-green-50 rounded-lg border border-green-100"
                    >
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.time} · {event.location}
                      </p>
                      {event.specialOffer && (
                        <p className="text-xs text-green-600 mt-2">{event.specialOffer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 即將到來的活動 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <h2 className="text-lg font-medium text-gray-900 mb-4">即將到來</h2>
              <UpcomingSchedule limit={5} onItemClick={handleEventClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
