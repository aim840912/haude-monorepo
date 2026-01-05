import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Save, Loader2, Link2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SingleImageUploader } from '@/components/features/products/ImageUploader'
import {
  type LocationFormProps,
  type LocationFormValues,
  type LocationFormErrors,
  type CreateLocationData,
  DEFAULT_FORM_VALUES,
} from './LocationForm.types'

/**
 * 販售據點表單元件
 *
 * 支援新增和編輯兩種模式：
 * - create: 建立新據點
 * - edit: 編輯現有據點
 */
export function LocationForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LocationFormProps) {
  // 表單值
  const [values, setValues] = useState<LocationFormValues>(() => {
    if (mode === 'edit' && initialData) {
      return {
        name: initialData.name,
        title: initialData.title,
        address: initialData.address,
        landmark: initialData.landmark,
        phone: initialData.phone,
        lineId: initialData.lineId,
        hours: initialData.hours,
        closedDays: initialData.closedDays,
        parking: initialData.parking,
        publicTransport: initialData.publicTransport,
        features: initialData.features.join(', '),
        specialties: initialData.specialties.join(', '),
        lat: initialData.coordinates.lat.toString(),
        lng: initialData.coordinates.lng.toString(),
        image: initialData.image,
        isMain: initialData.isMain,
      }
    }
    return DEFAULT_FORM_VALUES
  })

  // 驗證錯誤
  const [errors, setErrors] = useState<LocationFormErrors>({})
  // 已觸碰的欄位
  const [touched, setTouched] = useState<Set<string>>(new Set())
  // 圖片輸入模式
  const [imageMode, setImageMode] = useState<'url' | 'upload'>(() => {
    return initialData?.image ? 'url' : 'upload'
  })

  // 更新欄位值
  const setValue = useCallback(
    <K extends keyof LocationFormValues>(field: K, value: LocationFormValues[K]) => {
      setValues(prev => ({ ...prev, [field]: value }))
      // 清除該欄位的錯誤
      if (errors[field as keyof LocationFormErrors]) {
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
  const validate = useCallback((): LocationFormErrors => {
    const newErrors: LocationFormErrors = {}

    // 名稱驗證
    if (!values.name.trim()) {
      newErrors.name = '請輸入據點名稱'
    } else if (values.name.trim().length < 2) {
      newErrors.name = '據點名稱至少需要 2 個字元'
    }

    // 地址驗證
    if (!values.address.trim()) {
      newErrors.address = '請輸入據點地址'
    }

    // 電話驗證
    if (!values.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話'
    }

    // 營業時間驗證
    if (!values.hours.trim()) {
      newErrors.hours = '請輸入營業時間'
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
    const allFields = Object.keys(values) as (keyof LocationFormValues)[]
    setTouched(new Set(allFields))

    // 驗證
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // 準備提交資料
    const submitData: CreateLocationData = {
      name: values.name.trim(),
      title: values.title.trim() || values.name.trim(),
      address: values.address.trim(),
      landmark: values.landmark.trim(),
      phone: values.phone.trim(),
      lineId: values.lineId.trim(),
      hours: values.hours.trim(),
      closedDays: values.closedDays.trim(),
      parking: values.parking.trim(),
      publicTransport: values.publicTransport.trim(),
      features: values.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0),
      specialties: values.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      coordinates: {
        lat: values.lat ? parseFloat(values.lat) : 0,
        lng: values.lng ? parseFloat(values.lng) : 0,
      },
      image: values.image.trim(),
      imageFile: values.imageFile,
      isMain: values.isMain,
    }

    await onSubmit(submitData)
  }

  // 取得欄位錯誤（僅在已觸碰時顯示）
  const getFieldError = (field: keyof LocationFormErrors) => {
    return touched.has(field) ? errors[field] : undefined
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 據點名稱 */}
            <div>
              <label htmlFor="name" className="label">
                據點名稱 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={values.name}
                onChange={e => setValue('name', e.target.value)}
                onBlur={() => setFieldTouched('name')}
                className={cn('input', getFieldError('name') && 'border-red-500')}
                placeholder="例如：梅山農場總部"
              />
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
              )}
            </div>

            {/* 顯示標題 */}
            <div>
              <label htmlFor="title" className="label">
                顯示標題
              </label>
              <input
                id="title"
                type="text"
                value={values.title}
                onChange={e => setValue('title', e.target.value)}
                className="input"
                placeholder="例如：梅山農場 - 總部（留空則使用名稱）"
              />
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label htmlFor="address" className="label">
              地址 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={values.address}
              onChange={e => setValue('address', e.target.value)}
              onBlur={() => setFieldTouched('address')}
              className={cn('input', getFieldError('address') && 'border-red-500')}
              placeholder="請輸入完整地址"
            />
            {getFieldError('address') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('address')}</p>
            )}
          </div>

          {/* 地標說明 */}
          <div>
            <label htmlFor="landmark" className="label">
              地標說明
            </label>
            <input
              id="landmark"
              type="text"
              value={values.landmark}
              onChange={e => setValue('landmark', e.target.value)}
              className="input"
              placeholder="例如：梅山公園旁"
            />
          </div>
        </div>
      </section>

      {/* 聯絡資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">聯絡資訊</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 電話 */}
          <div>
            <label htmlFor="phone" className="label">
              聯絡電話 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={e => setValue('phone', e.target.value)}
              onBlur={() => setFieldTouched('phone')}
              className={cn('input', getFieldError('phone') && 'border-red-500')}
              placeholder="例如：05-2621234"
            />
            {getFieldError('phone') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('phone')}</p>
            )}
          </div>

          {/* LINE ID */}
          <div>
            <label htmlFor="lineId" className="label">
              LINE ID
            </label>
            <input
              id="lineId"
              type="text"
              value={values.lineId}
              onChange={e => setValue('lineId', e.target.value)}
              className="input"
              placeholder="例如：@meishan-farm"
            />
          </div>
        </div>
      </section>

      {/* 營業資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">營業資訊</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 營業時間 */}
          <div>
            <label htmlFor="hours" className="label">
              營業時間 <span className="text-red-500">*</span>
            </label>
            <input
              id="hours"
              type="text"
              value={values.hours}
              onChange={e => setValue('hours', e.target.value)}
              onBlur={() => setFieldTouched('hours')}
              className={cn('input', getFieldError('hours') && 'border-red-500')}
              placeholder="例如：週一至週日 08:00-18:00"
            />
            {getFieldError('hours') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('hours')}</p>
            )}
          </div>

          {/* 休業日 */}
          <div>
            <label htmlFor="closedDays" className="label">
              休業日
            </label>
            <input
              id="closedDays"
              type="text"
              value={values.closedDays}
              onChange={e => setValue('closedDays', e.target.value)}
              className="input"
              placeholder="例如：除夕、初一"
            />
          </div>
        </div>
      </section>

      {/* 交通資訊區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">交通資訊</h2>
        <div className="space-y-4">
          {/* 停車資訊 */}
          <div>
            <label htmlFor="parking" className="label">
              停車資訊
            </label>
            <input
              id="parking"
              type="text"
              value={values.parking}
              onChange={e => setValue('parking', e.target.value)}
              className="input"
              placeholder="例如：免費停車場，可容納 50 台車"
            />
          </div>

          {/* 大眾運輸 */}
          <div>
            <label htmlFor="publicTransport" className="label">
              大眾運輸
            </label>
            <input
              id="publicTransport"
              type="text"
              value={values.publicTransport}
              onChange={e => setValue('publicTransport', e.target.value)}
              className="input"
              placeholder="例如：嘉義客運梅山站下車，步行約 5 分鐘"
            />
          </div>
        </div>
      </section>

      {/* 特色與特產區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">特色與特產</h2>
        <div className="space-y-4">
          {/* 據點特色 */}
          <div>
            <label htmlFor="features" className="label">
              據點特色
            </label>
            <input
              id="features"
              type="text"
              value={values.features}
              onChange={e => setValue('features', e.target.value)}
              className="input"
              placeholder="以逗號分隔，例如：農產品直銷, 餐廳, 停車場"
            />
            <p className="mt-1 text-sm text-gray-500">多個特色請以逗號分隔</p>
          </div>

          {/* 特產 */}
          <div>
            <label htmlFor="specialties" className="label">
              特產
            </label>
            <input
              id="specialties"
              type="text"
              value={values.specialties}
              onChange={e => setValue('specialties', e.target.value)}
              className="input"
              placeholder="以逗號分隔，例如：高山茶, 梅子製品, 竹筍"
            />
            <p className="mt-1 text-sm text-gray-500">多個特產請以逗號分隔</p>
          </div>
        </div>
      </section>

      {/* 座標與圖片區塊 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">座標與圖片</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 緯度 */}
            <div>
              <label htmlFor="lat" className="label">
                緯度 (Latitude)
              </label>
              <input
                id="lat"
                type="text"
                value={values.lat}
                onChange={e => setValue('lat', e.target.value)}
                className="input"
                placeholder="例如：23.5878"
              />
            </div>

            {/* 經度 */}
            <div>
              <label htmlFor="lng" className="label">
                經度 (Longitude)
              </label>
              <input
                id="lng"
                type="text"
                value={values.lng}
                onChange={e => setValue('lng', e.target.value)}
                className="input"
                placeholder="例如：120.5569"
              />
            </div>
          </div>

          {/* 據點圖片 */}
          <div>
            <label className="label">據點圖片</label>

            {/* 模式切換 */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  imageMode === 'upload'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Upload className="w-4 h-4" />
                上傳圖片
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  imageMode === 'url'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Link2 className="w-4 h-4" />
                使用網址
              </button>
            </div>

            {/* 根據模式顯示對應輸入 */}
            {imageMode === 'upload' ? (
              <div className="max-w-xs">
                <SingleImageUploader
                  initialImage={values.image || undefined}
                  onFileSelected={file => setValue('imageFile', file)}
                  onDelete={() => {
                    setValue('imageFile', undefined)
                    setValue('image', '')
                  }}
                />
              </div>
            ) : (
              <input
                id="image"
                type="url"
                value={values.image}
                onChange={e => setValue('image', e.target.value)}
                className="input"
                placeholder="請輸入圖片網址"
              />
            )}
          </div>
        </div>
      </section>

      {/* 狀態設定 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">設為總部</h2>
            <p className="text-sm text-gray-500">
              {values.isMain ? '此據點將顯示為主要據點' : '此據點為一般據點'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={values.isMain}
              onChange={e => setValue('isMain', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
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
              {mode === 'create' ? '建立據點' : '儲存變更'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
