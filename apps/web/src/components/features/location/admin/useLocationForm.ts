import { useState, useCallback, useMemo } from 'react'
import {
  type LocationFormProps,
  type LocationFormValues,
  type LocationFormErrors,
  type CreateLocationData,
  DEFAULT_FORM_VALUES,
} from './LocationForm.types'

/**
 * 販售據點表單邏輯 Hook
 *
 * 負責管理表單狀態、驗證和提交邏輯
 */
export function useLocationForm({
  mode,
  initialData,
  onSubmit,
}: Pick<LocationFormProps, 'mode' | 'initialData' | 'onSubmit'>) {
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

    if (!values.name.trim()) {
      newErrors.name = '請輸入據點名稱'
    } else if (values.name.trim().length < 2) {
      newErrors.name = '據點名稱至少需要 2 個字元'
    }

    if (!values.address.trim()) {
      newErrors.address = '請輸入據點地址'
    }

    if (!values.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話'
    }

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

  // 取得欄位錯誤（僅在已觸碰時顯示）
  const getFieldError = useCallback(
    (field: keyof LocationFormErrors) => {
      return touched.has(field) ? errors[field] : undefined
    },
    [touched, errors]
  )

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

  return {
    values,
    setValue,
    setFieldTouched,
    getFieldError,
    hasErrors,
    handleSubmit,
  }
}
