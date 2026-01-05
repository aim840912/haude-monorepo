import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ScheduleFormProps,
  type ScheduleFormValues,
  type ScheduleFormErrors,
  type CreateScheduleData,
  DEFAULT_FORM_VALUES,
  STATUS_OPTIONS,
} from './ScheduleForm.types'

/**
 * 活動日程表單元件
 *
 * 支援新增和編輯兩種模式：
 * - create: 建立新日程
 * - edit: 編輯現有日程
 */
export function ScheduleForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ScheduleFormProps) {
  // 表單值
  const [values, setValues] = useState<ScheduleFormValues>(() => {
    if (mode === 'edit' && initialData) {
      return {
        title: initialData.title,
        location: initialData.location,
        date: initialData.date,
        time: initialData.time,
        status: initialData.status,
        products: initialData.products.join(', '),
        description: initialData.description,
        contact: initialData.contact,
        specialOffer: initialData.specialOffer || '',
        weatherNote: initialData.weatherNote || '',
      }
    }
    return DEFAULT_FORM_VALUES
  })

  // 驗證錯誤
  const [errors, setErrors] = useState<ScheduleFormErrors>({})
  // 已觸碰的欄位
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // 更新欄位值
  const setValue = useCallback(
    <K extends keyof ScheduleFormValues>(field: K, value: ScheduleFormValues[K]) => {
      setValues(prev => ({ ...prev, [field]: value }))
      // 清除該欄位的錯誤
      if (errors[field as keyof ScheduleFormErrors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  // 標記欄位為已觸碰
  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }, [])

  // 驗證邏輯
  const validate = useCallback((): ScheduleFormErrors => {
    const newErrors: ScheduleFormErrors = {}

    // 標題驗證
    if (!values.title.trim()) {
      newErrors.title = '請輸入活動標題'
    } else if (values.title.trim().length < 2) {
      newErrors.title = '活動標題至少需要 2 個字元'
    }

    // 地點驗證
    if (!values.location.trim()) {
      newErrors.location = '請輸入活動地點'
    }

    // 日期驗證
    if (!values.date) {
      newErrors.date = '請選擇活動日期'
    }

    // 時間驗證
    if (!values.time.trim()) {
      newErrors.time = '請輸入活動時間'
    }

    // 聯絡電話驗證
    if (!values.contact.trim()) {
      newErrors.contact = '請輸入聯絡電話'
    }

    return newErrors
  }, [values])

  // 是否有錯誤
  const hasErrors = useMemo(() => {
    const currentErrors = validate()
    return Object.keys(currentErrors).length > 0
  }, [validate])

  // 處理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 標記所有欄位為已觸碰
    const allFields = Object.keys(values) as (keyof ScheduleFormValues)[]
    setTouched(new Set(allFields))

    // 驗證
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // 準備提交資料
    const submitData: CreateScheduleData = {
      title: values.title.trim(),
      location: values.location.trim(),
      date: values.date,
      time: values.time.trim(),
      status: values.status,
      products: values.products
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0),
      description: values.description.trim(),
      contact: values.contact.trim(),
      specialOffer: values.specialOffer.trim() || undefined,
      weatherNote: values.weatherNote.trim() || undefined,
    }

    await onSubmit(submitData)
  }

  // 取得欄位錯誤（僅在已觸碰時顯示）
  const getFieldError = (field: keyof ScheduleFormErrors) => {
    return touched.has(field) ? errors[field] : undefined
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
        <div className="space-y-4">
          {/* 活動標題 */}
          <div>
            <label htmlFor="title" className="label">
              活動標題 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={values.title}
              onChange={e => setValue('title', e.target.value)}
              onBlur={() => setFieldTouched('title')}
              className={cn('input', getFieldError('title') && 'border-red-500')}
              placeholder="請輸入活動標題"
            />
            {getFieldError('title') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('title')}</p>
            )}
          </div>

          {/* 活動地點 */}
          <div>
            <label htmlFor="location" className="label">
              活動地點 <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              type="text"
              value={values.location}
              onChange={e => setValue('location', e.target.value)}
              onBlur={() => setFieldTouched('location')}
              className={cn('input', getFieldError('location') && 'border-red-500')}
              placeholder="請輸入活動地點"
            />
            {getFieldError('location') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('location')}</p>
            )}
          </div>

          {/* 活動描述 */}
          <div>
            <label htmlFor="description" className="label">
              活動描述
            </label>
            <textarea
              id="description"
              value={values.description}
              onChange={e => setValue('description', e.target.value)}
              className="input min-h-[100px]"
              placeholder="請輸入活動描述（選填）"
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* 時間設定區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">時間設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 活動日期 */}
          <div>
            <label htmlFor="date" className="label">
              活動日期 <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={values.date}
              onChange={e => setValue('date', e.target.value)}
              onBlur={() => setFieldTouched('date')}
              className={cn('input', getFieldError('date') && 'border-red-500')}
            />
            {getFieldError('date') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('date')}</p>
            )}
          </div>

          {/* 活動時間 */}
          <div>
            <label htmlFor="time" className="label">
              活動時間 <span className="text-red-500">*</span>
            </label>
            <input
              id="time"
              type="text"
              value={values.time}
              onChange={e => setValue('time', e.target.value)}
              onBlur={() => setFieldTouched('time')}
              className={cn('input', getFieldError('time') && 'border-red-500')}
              placeholder="例如: 09:00-12:00"
            />
            {getFieldError('time') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('time')}</p>
            )}
          </div>

          {/* 狀態選擇 */}
          <div>
            <label htmlFor="status" className="label">
              狀態
            </label>
            <select
              id="status"
              value={values.status}
              onChange={e => setValue('status', e.target.value as ScheduleFormValues['status'])}
              className="input"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 相關產品區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">相關產品</h2>
        <div>
          <label htmlFor="products" className="label">
            產品列表
          </label>
          <input
            id="products"
            type="text"
            value={values.products}
            onChange={e => setValue('products', e.target.value)}
            className="input"
            placeholder="以逗號分隔，例如: 高山茶, 蜂蜜, 梅子醬"
          />
          <p className="mt-1 text-sm text-gray-500">
            輸入此活動相關的產品，以逗號分隔
          </p>
        </div>
      </section>

      {/* 聯絡與備註區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">聯絡與備註</h2>
        <div className="space-y-4">
          {/* 聯絡電話 */}
          <div>
            <label htmlFor="contact" className="label">
              聯絡電話 <span className="text-red-500">*</span>
            </label>
            <input
              id="contact"
              type="tel"
              value={values.contact}
              onChange={e => setValue('contact', e.target.value)}
              onBlur={() => setFieldTouched('contact')}
              className={cn('input', getFieldError('contact') && 'border-red-500')}
              placeholder="例如: 05-2621234"
            />
            {getFieldError('contact') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('contact')}</p>
            )}
          </div>

          {/* 特別優惠 */}
          <div>
            <label htmlFor="specialOffer" className="label">
              特別優惠
            </label>
            <input
              id="specialOffer"
              type="text"
              value={values.specialOffer}
              onChange={e => setValue('specialOffer', e.target.value)}
              className="input"
              placeholder="例如: 早鳥優惠 9 折（選填）"
            />
          </div>

          {/* 天氣備註 */}
          <div>
            <label htmlFor="weatherNote" className="label">
              天氣備註
            </label>
            <input
              id="weatherNote"
              type="text"
              value={values.weatherNote}
              onChange={e => setValue('weatherNote', e.target.value)}
              className="input"
              placeholder="例如: 雨天照常營業（選填）"
            />
          </div>
        </div>
      </section>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="btn btn-primary order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'create' ? '建立中...' : '儲存中...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? '建立日程' : '儲存變更'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
