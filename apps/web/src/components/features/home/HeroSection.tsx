'use client'

/**
 * 首頁 Hero — 方向 A「沉穩茶褐」
 *
 * 與原版差異：
 * - 主標改為價值主張（襯線、左對齊），品牌名退回導覽列
 * - eyebrow 改為「梅山 1,200M · 自然農法」＋金色細線
 * - 遮罩由純黑 40% 改為方向性暖色漸層（左深右淺＋底部漸層）
 * - CTA 主按鈕用品牌金 #d4af37（取代 off-brand 橘 #d35400）
 * - 第一屏底部新增信任列
 * - 進度條顏色橘 → 金
 *
 * 保留：背景輪播 + Ken Burns、scrollY 視差、進度條、左右箭頭
 * Props 與原版相同，可直接替換。
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { easing } from '@/lib/motion'

interface HeroSectionProps {
  images: string[]
  currentSlide: number
  onSlideChange: (index: number) => void
}

const TRUST = ['自然農法栽培', '產地直送', '海拔 1,200M', '百年製茶工藝']

export function HeroSection({ images, currentSlide, onSlideChange }: HeroSectionProps) {
  const [progress, setProgress] = useState(0)

  // Scroll-driven parallax — MotionValues don't trigger React re-renders
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 500], [0, 150])
  const contentY = useTransform(scrollY, [0, 500], [0, 100])
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0])
  const arrowOpacity = useTransform(scrollY, [0, 100], [1, 0])

  useEffect(() => {
    let p = 0
    const interval = setInterval(() => {
      p += 2
      if (p >= 100) {
        onSlideChange((currentSlide + 1) % images.length)
        p = 0
      }
      setProgress(p)
    }, 100)
    return () => clearInterval(interval)
  }, [currentSlide, images.length, onSlideChange])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* 背景圖輪播 + Ken Burns */}
      {images.map((image, index) => (
        <motion.div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'animate-ken-burns' : ''
          }`}
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#3e2723',
            opacity: currentSlide === index ? 1 : 0,
            y: bgY,
          }}
        />
      ))}

      {/* 方向性暖色遮罩 — 左深右淺，確保左側文字可讀 + 底部加深 */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(30,15,10,0.78) 0%, rgba(30,15,10,0.45) 42%, rgba(30,15,10,0.05) 100%), linear-gradient(0deg, rgba(20,10,6,0.6) 0%, rgba(20,10,6,0) 38%)',
        }}
      />

      {/* Hero 內容 — 左對齊 */}
      <motion.div
        className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-2xl">
          {/* eyebrow + 金色細線 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: easing.easeOut }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="block w-10 h-px bg-[#d4af37]" />
            <span className="text-sm tracking-[0.26em] uppercase text-[#d4af37]">
              梅山 1,200M · 自然農法
            </span>
          </motion.div>

          {/* 主標 — 價值主張 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easing.easeOut }}
            className="font-serif text-white text-4xl md:text-6xl lg:text-7xl leading-[1.18] tracking-wide drop-shadow-lg"
          >
            簡單一杯茶，
            <br />
            不簡單的百年傳承
          </motion.h1>

          {/* 副標 */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: easing.easeOut }}
            className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed max-w-xl drop-shadow-md"
          >
            座落梅山群峰之間，以自然農法呈現四季最美的高山茶滋味。
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: easing.easeOut }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-[#d4af37] hover:bg-[#c5a028] text-[#3a2a08] font-semibold px-8 py-4 rounded-sm text-lg transition-[background-color,box-shadow,transform] duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              選購高山茶
            </Link>
            <Link
              href="/farm-tours"
              className="inline-flex items-center justify-center border border-white/55 hover:border-white text-white px-8 py-4 rounded-sm text-lg font-medium transition-colors duration-300"
            >
              預約茶園體驗
            </Link>
          </motion.div>

          {/* 信任列 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80"
          >
            {TRUST.map((t, i) => (
              <span key={t} className="flex items-center gap-6">
                {i > 0 && <span className="hidden sm:block w-px h-3 bg-white/30 -ml-3" />}
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* 滾動提示箭頭 */}
      <motion.div
        style={{ opacity: arrowOpacity }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
      >
        <ChevronDown className="w-8 h-8 text-white/70 animate-scroll-bounce" />
      </motion.div>

      {/* 輪播控制區 - 底部進度條 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="flex">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                onSlideChange(index)
                setProgress(0)
              }}
              className="flex-1 h-1 bg-white/30 relative overflow-hidden"
              aria-label={`切換到第 ${index + 1} 張圖片`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#d4af37] transition-[width] duration-100"
                style={{ width: currentSlide === index ? `${progress}%` : '0%' }}
              />
            </button>
          ))}
        </div>

        <div className="absolute bottom-8 right-8 flex gap-2">
          <button
            onClick={() => {
              const prevSlide = (currentSlide - 1 + images.length) % images.length
              onSlideChange(prevSlide)
              setProgress(0)
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="上一張"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const nextSlide = (currentSlide + 1) % images.length
              onSlideChange(nextSlide)
              setProgress(0)
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="下一張"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
