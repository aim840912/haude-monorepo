'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { easing, spring } from '@/lib/motion'

interface HeroSectionProps {
  images: string[]
  scrollY: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

const titleChars = ['豪', '德', '製', '茶']

export function HeroSection({ images, scrollY, currentSlide, onSlideChange }: HeroSectionProps) {
  const [progress, setProgress] = useState(0)

  // 進度條動畫 - 每 100ms 增加 2%
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 2))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // 當進度達到 100% 時切換幻燈片
  useEffect(() => {
    if (progress >= 100) {
      const nextSlide = (currentSlide + 1) % images.length
      onSlideChange(nextSlide)
      setProgress(0)
    }
  }, [progress, currentSlide, images.length, onSlideChange])

  return (
    <section className="relative min-h-screen flex flex-col justify-center text-center pt-16 overflow-hidden">
      {/* 背景圖輪播 + Ken Burns */}
      {images.map((image, index) => (
        <div
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
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
      ))}

      {/* 遮罩確保文字可讀性 */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Hero 內容 - 入場序列動畫 */}
      <div
        className="relative z-20 px-6"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`,
          opacity: Math.max(0, 1 - scrollY / 600),
        }}
      >
        {/* 品牌副標 - 最先淡入 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: easing.easeOut }}
          className="text-sm md:text-base text-white/80 mb-4 tracking-[0.3em] uppercase"
        >
          高山茶專賣店
        </motion.p>

        {/* 主標題 - 逐字 3D 揭示 */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 drop-shadow-lg flex justify-center" style={{ perspective: '800px' }}>
          {titleChars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.9 + i * 0.15,
                duration: 0.6,
                ease: easing.easeOut,
              }}
              className="inline-block"
              style={{ transformOrigin: 'bottom center' }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* Slogan - 主標完成後淡入 */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.0, ease: easing.easeOut }}
          className="text-lg md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-md leading-relaxed"
        >
          簡單一杯茶，不簡單的百年傳承
          <br />
          <span className="text-base md:text-lg text-white/80">
            座落梅山群峰，以自然農法呈現四季最美的農產滋味
          </span>
        </motion.p>

        {/* CTA 按鈕 - 縮放彈入 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.bounce, delay: 2.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/products"
            className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            探索產品
          </Link>
          <Link
            href="/about"
            className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 border border-white/50"
          >
            了解更多
          </Link>
        </motion.div>
      </div>

      {/* 滾動提示箭頭 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: scrollY > 100 ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
      >
        <ChevronDown className="w-8 h-8 text-white/70 animate-scroll-bounce" />
      </motion.div>

      {/* 輪播控制區 - 底部進度條 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* 進度條 */}
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
                className="absolute inset-y-0 left-0 bg-[#d35400] transition-all duration-100"
                style={{
                  width: currentSlide === index ? `${progress}%` : '0%',
                }}
              />
            </button>
          ))}
        </div>

        {/* 左右箭頭導航 */}
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
