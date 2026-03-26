'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { DEFAULT_PLACEHOLDERS } from '@/config/placeholder.config'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  /** 圖片載入失敗時的替代 URL，預設使用商品 placeholder */
  fallbackSrc?: string
}

/**
 * 防禦性圖片元件
 *
 * 封裝 next/image，當圖片 URL 失效（404、網路錯誤等）時
 * 自動切換到 fallbackSrc，避免破圖。
 *
 * @example
 * <SafeImage src={product.imageUrl} alt={product.name} fill sizes="80px" />
 * <SafeImage src={url} fallbackSrc={PLACEHOLDER_IMAGES.product('茶葉')} alt="tea" fill />
 */
export function SafeImage({
  fallbackSrc = DEFAULT_PLACEHOLDERS.product,
  src,
  alt,
  ...props
}: SafeImageProps) {
  const [errored, setErrored] = useState(false)

  return (
    <Image
      {...props}
      src={errored ? fallbackSrc : src}
      alt={alt}
      onError={() => setErrored(true)}
    />
  )
}
