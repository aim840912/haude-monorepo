import { useState } from 'react'
import { Link2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SingleImageUploader } from '@/components/features/products/ImageUploader'
import type { LocationFormValues, LocationFormErrors } from './LocationForm.types'

interface FormFieldsProps {
  values: LocationFormValues
  setValue: <K extends keyof LocationFormValues>(field: K, value: LocationFormValues[K]) => void
  setFieldTouched: (field: string) => void
  getFieldError: (field: keyof LocationFormErrors) => string | undefined
}

/**
 * 基本資訊區塊
 */
export function BasicInfoSection({ values, setValue, setFieldTouched, getFieldError }: FormFieldsProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  )
}

/**
 * 聯絡資訊區塊
 */
export function ContactInfoSection({ values, setValue, setFieldTouched, getFieldError }: FormFieldsProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">聯絡資訊</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  )
}

/**
 * 營業資訊區塊
 */
export function BusinessInfoSection({ values, setValue, setFieldTouched, getFieldError }: FormFieldsProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">營業資訊</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  )
}

/**
 * 交通資訊區塊
 */
export function TransportInfoSection({ values, setValue }: Omit<FormFieldsProps, 'setFieldTouched' | 'getFieldError'>) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">交通資訊</h2>
      <div className="space-y-4">
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
  )
}

/**
 * 特色與特產區塊
 */
export function FeaturesSection({ values, setValue }: Omit<FormFieldsProps, 'setFieldTouched' | 'getFieldError'>) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">特色與特產</h2>
      <div className="space-y-4">
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
  )
}

/**
 * 座標與圖片區塊
 */
export function MediaSection({
  values,
  setValue,
  initialImage,
}: Omit<FormFieldsProps, 'setFieldTouched' | 'getFieldError'> & { initialImage?: string }) {
  const [imageMode, setImageMode] = useState<'url' | 'upload'>(() => {
    return initialImage ? 'url' : 'upload'
  })

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">座標與圖片</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div>
          <label className="label">據點圖片</label>

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
  )
}

/**
 * 狀態設定區塊
 */
export function StatusSection({ values, setValue }: Omit<FormFieldsProps, 'setFieldTouched' | 'getFieldError'>) {
  return (
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
  )
}
