import { useState, useCallback, useMemo } from 'react'
import { TimePickerChinese } from './TimePickerChinese'

interface TimeRangePickerProps {
  /** 時間範圍值，格式："HH:mm-HH:mm" (例如："08:00-18:00") */
  value: string
  /** 值變更時的回調函數 */
  onChange: (value: string) => void
  /** 是否為必填欄位 */
  required?: boolean
  /** 自訂樣式類別 */
  className?: string
  /** 錯誤訊息 */
  error?: string
}

// 解析時間範圍字串（純函數）
function parseTimeRange(value: string): { startTime: string; endTime: string } {
  if (value && value.includes('-')) {
    const [start, end] = value.split('-')
    if (start && end) {
      return { startTime: start.trim(), endTime: end.trim() }
    }
  }
  return { startTime: '08:00', endTime: '18:00' }
}

/**
 * 時間範圍選擇器
 *
 * 使用兩個 TimePickerChinese 元件來選擇營業時間範圍
 * 自動驗證結束時間必須大於開始時間
 */
export function TimeRangePicker({
  value,
  onChange,
  required = false,
  className = '',
  error,
}: TimeRangePickerProps) {
  const [validationError, setValidationError] = useState<string>('')

  // 使用 useMemo 計算派生狀態，避免 useEffect 中的 setState
  const { startTime, endTime } = useMemo(() => parseTimeRange(value), [value])

  // 驗證時間範圍（支援跨日營業）
  const validateTimeRange = useCallback((start: string, end: string): string => {
    if (!start || !end) {
      return ''
    }

    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // 不允許開始和結束時間完全相同（0小時營業）
    if (endMinutes === startMinutes) {
      return '營業時間不能為0小時'
    }

    // 允許跨日營業（例如：22:00-02:00 表示晚上10點到隔天凌晨2點）
    return ''
  }, [])

  // 處理開始時間變更
  const handleStartTimeChange = (time: string) => {
    const error = validateTimeRange(time, endTime)
    setValidationError(error)

    if (!error) {
      onChange(`${time}-${endTime}`)
    }
  }

  // 處理結束時間變更
  const handleEndTimeChange = (time: string) => {
    const error = validateTimeRange(startTime, time)
    setValidationError(error)

    if (!error) {
      onChange(`${startTime}-${time}`)
    }
  }

  // 判斷是否為跨日營業
  const isOvernightBusiness = () => {
    if (!startTime || !endTime) return false

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return endMinutes < startMinutes
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {/* 開始時間選擇器 */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">開始時間</label>
          <TimePickerChinese
            value={startTime}
            onChange={handleStartTimeChange}
            required={required}
          />
        </div>

        {/* 結束時間選擇器 */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">結束時間</label>
          <TimePickerChinese value={endTime} onChange={handleEndTimeChange} required={required} />
        </div>
      </div>

      {/* 跨日營業提示 */}
      {isOvernightBusiness() && !validationError && !error && (
        <p className="mt-2 text-sm text-green-600">⏰ 跨日營業（結束時間為隔日）</p>
      )}

      {/* 錯誤訊息顯示 */}
      {(validationError || error) && (
        <p className="mt-2 text-sm text-red-600">{validationError || error}</p>
      )}
    </div>
  )
}
