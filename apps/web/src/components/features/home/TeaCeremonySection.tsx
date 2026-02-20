/**
 * 滾動驅動泡茶動畫區段
 *
 * 使用 CSS sticky + Framer Motion useScroll/useTransform
 * 實現「從茶園到茶杯」的多層滾動敘事動畫。
 *
 * 架構：外層 300vh 容器提供滾動距離，
 * 內層 sticky 容器固定在視窗，scrollYProgress 驅動各圖層。
 */

'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, ArrowRight } from 'lucide-react'
import {
  motion,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion'
import { useElementScroll } from '@/hooks/useElementScroll'

// ===== 子元件：CSS 茶壺 =====
function Teapot() {
  return (
    <div className="relative w-56 h-44 md:w-72 md:h-56">
      {/* 壺身 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-36 md:w-56 md:h-48 bg-[#5d4037] rounded-[50%_50%_45%_45%] shadow-lg" />
      {/* 壺蓋 — 緊貼壺身頂部 */}
      <div className="absolute bottom-[74%] left-1/2 -translate-x-1/2 w-24 h-6 md:w-32 md:h-8 bg-[#4e342e] rounded-full" />
      {/* 蓋鈕 */}
      <div className="absolute bottom-[82%] left-1/2 -translate-x-1/2 w-7 h-5 md:w-9 md:h-7 bg-[#4e342e] rounded-full" />
      {/* 壺嘴 */}
      <div className="absolute bottom-12 -right-6 md:-right-8 w-14 h-6 md:w-20 md:h-7 bg-[#5d4037] rounded-r-full origin-left -rotate-12" />
      {/* 壺把 */}
      <div className="absolute bottom-8 -left-4 md:-left-6 w-10 h-24 md:w-14 md:h-28 border-[6px] border-[#5d4037] rounded-l-full border-r-0" />
    </div>
  )
}

// ===== 子元件：CSS 茶杯 =====
function Teacup({ fillHeight }: { fillHeight: MotionValue<string> }) {
  return (
    <div className="relative w-44 h-36 md:w-56 md:h-44">
      {/* 杯身 — 梯形用 border trick */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-28 md:w-48 md:h-36 bg-white/90 dark:bg-[#d7ccc8] rounded-b-[40%] overflow-hidden shadow-md border border-[#d4af37]/30">
        {/* 茶水填充 */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-[#c68a4a]/70"
          style={{ height: fillHeight }}
        />
      </div>
      {/* 杯把 — 位置上移、加粗 */}
      <div className="absolute bottom-8 -right-2 md:-right-3 w-6 h-14 md:w-8 md:h-16 border-[6px] border-white/80 dark:border-[#d7ccc8] rounded-r-full border-l-0" />
      {/* 杯碟 */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-5 md:w-60 md:h-6 bg-white/70 dark:bg-[#d7ccc8]/70 rounded-full shadow-sm" />
    </div>
  )
}

// ===== 子元件：蒸氣 =====
function SteamLines() {
  const lines = [
    { w: 'w-3.5', h: 'h-16 md:h-24', delay: '0s' },
    { w: 'w-4', h: 'h-24 md:h-28', delay: '0.5s' },
    { w: 'w-3.5', h: 'h-14 md:h-20', delay: '1s' },
  ]
  return (
    <div className="flex gap-4 justify-center">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`${line.w} ${line.h} bg-[#a1887f]/30 rounded-full blur-[4px] animate-float`}
          style={{ animationDelay: line.delay, animationDuration: '2s' }}
        />
      ))}
    </div>
  )
}

// ===== 主元件 =====
export function TeaCeremonySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Hydration fix: defer reduced-motion check until after mount
  // SSR: mounted=false → isReduced=false → render animated version
  // Client hydration: mounted=false → isReduced=false → matches SSR ✅
  // Post-mount: mounted=true → respects actual user preference
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isReduced = mounted && prefersReducedMotion

  const { scrollYProgress } = useElementScroll(containerRef, ['start start', 'end end'])

  // --- 茶葉飄落 (0.00 - 0.30+) — 輕微浮動，不掃過其他元素 ---
  const leaf1Y = useTransform(scrollYProgress, [0, 0.3], ['-3%', '8%'])
  const leaf2Y = useTransform(scrollYProgress, [0.02, 0.35], ['-5%', '6%'])
  const leaf3Y = useTransform(scrollYProgress, [0.05, 0.4], ['-2%', '10%'])
  const leafOpacity = useTransform(scrollYProgress, [0, 0.05, 0.15], [0, 1, 1])

  // --- 茶壺滑入 (0.15 - 0.40) + 傾斜倒茶 (0.35 - 0.60) ---
  const teapotY = useTransform(scrollYProgress, [0.15, 0.4], ['-80%', '5%'])
  const teapotOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1])
  const teapotRotate = useTransform(scrollYProgress, [0.35, 0.6], [0, 35])

  // --- 茶杯升起 (0.30 - 0.50) ---
  const cupY = useTransform(scrollYProgress, [0.3, 0.5], ['60%', '0%'])
  const cupScale = useTransform(scrollYProgress, [0.3, 0.5], [0.8, 1])
  const cupOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1])

  // --- 茶水填充 (0.50 - 0.75) ---
  const teaFill = useTransform(scrollYProgress, [0.5, 0.75], ['0%', '85%'])

  // --- 蒸氣 (0.70 - 0.90) ---
  const steamOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const steamY = useTransform(scrollYProgress, [0.7, 0.9], ['10px', '-20px'])

  // --- 文字淡入（累積顯示，不淡出）---
  const text1Opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
  const text2Opacity = useTransform(scrollYProgress, [0.30, 0.42], [0, 1])
  const text3Opacity = useTransform(scrollYProgress, [0.65, 0.78], [0, 1])

  // --- CTA 淡入 (0.85 - 1.00) ---
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1])
  const ctaY = useTransform(scrollYProgress, [0.85, 0.95], ['20px', '0px'])

  // prefers-reduced-motion：靜態版本
  if (isReduced) {
    return (
      <section className="py-24 px-6 bg-[#f8f5f0] dark:bg-[#1a120d]">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-12 h-12 text-[#5d4037] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-4">
            從茶園到茶杯
          </h2>
          <p className="text-[#5d4037] dark:text-[#bcaaa4] text-lg mb-2">
            精選梅山高山茶葉，三代傳承的古法製茶
          </p>
          <p className="text-[#5d4037] dark:text-[#bcaaa4] text-lg mb-8">
            每一口都是山林的滋味
          </p>
          <Link
            href="/products"
            className="inline-flex items-center text-[#d4af37] hover:text-[#c68a00] text-lg transition-colors"
          >
            探索產品
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh] md:h-[300vh]"
    >
      {/* Sticky 內容容器 */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {/* 背景層 (z-0) */}
        <div className="absolute inset-0 bg-[#f8f5f0] dark:bg-[#1a120d] z-0">
          {/* 裝飾性茶葉紋理 */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute top-[10%] left-[5%] w-40 h-40 border border-[#5d4037] rounded-full" />
            <div className="absolute top-[30%] right-[10%] w-60 h-60 border border-[#5d4037] rounded-full" />
            <div className="absolute bottom-[15%] left-[15%] w-32 h-32 border border-[#5d4037] rounded-full" />
          </div>
        </div>

        {/* Text 1 — 左側 */}
        <motion.div
          className="absolute left-6 md:left-[10%] top-[12%] md:top-[15%] z-10 text-left max-w-[200px] md:max-w-xs"
          style={{ opacity: text1Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            精選梅山高山茶葉
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            海拔一千公尺的純淨風土
          </p>
        </motion.div>

        {/* Text 2 — 右側 */}
        <motion.div
          className="absolute right-6 md:right-[10%] top-[40%] md:top-[42%] z-10 text-right max-w-[200px] md:max-w-xs"
          style={{ opacity: text2Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            三代傳承的古法製茶
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            以時間與溫度淬煉風味
          </p>
        </motion.div>

        {/* Text 3 — 左側 */}
        <motion.div
          className="absolute left-6 md:left-[10%] top-[65%] md:top-[68%] z-10 text-left max-w-[200px] md:max-w-xs"
          style={{ opacity: text3Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            每一口都是山林的滋味
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            從茶園到您的茶杯
          </p>
        </motion.div>

        {/* 茶葉飄落層 (z-20) */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{ opacity: leafOpacity }}
        >
          {/* 葉 1：右上角（遠離所有元素） */}
          <motion.div className="absolute left-[88%] top-[8%]" style={{ y: leaf1Y }}>
            <Leaf className="w-12 h-12 md:w-16 md:h-16 text-[#3e2723] rotate-45" />
          </motion.div>
          {/* 葉 2：右中（Text1-Text2 間隙） */}
          <motion.div className="absolute left-[85%] top-[32%]" style={{ y: leaf2Y }}>
            <Leaf className="w-10 h-10 md:w-14 md:h-14 text-[#4e342e] -rotate-30" />
          </motion.div>
          {/* 葉 3：左中（Text2-Text3 間隙） */}
          <motion.div className="absolute left-[5%] top-[48%]" style={{ y: leaf3Y }}>
            <Leaf className="w-11 h-11 md:w-14 md:h-14 text-[#5d4037] rotate-12" />
          </motion.div>
        </motion.div>

        {/* 茶壺層 (z-30) */}
        <motion.div
          className="absolute left-1/2 -translate-x-[70%] md:-translate-x-[75%] top-[28%] md:top-[22%] z-30 transform-gpu"
          style={{
            y: teapotY,
            opacity: teapotOpacity,
            rotate: teapotRotate,
          }}
        >
          <Teapot />
        </motion.div>

        {/* 茶杯層 (z-40) */}
        <motion.div
          className="absolute left-1/2 -translate-x-[40%] md:-translate-x-[35%] top-[60%] md:top-[56%] z-40 transform-gpu"
          style={{
            y: cupY,
            scale: cupScale,
            opacity: cupOpacity,
          }}
        >
          <Teacup fillHeight={teaFill} />
        </motion.div>

        {/* 蒸氣層 (z-50) */}
        <motion.div
          className="absolute left-1/2 -translate-x-[40%] md:-translate-x-[35%] top-[57%] md:top-[52%] z-50 w-44 md:w-56 transform-gpu"
          style={{ opacity: steamOpacity, y: steamY }}
        >
          <SteamLines />
        </motion.div>

        {/* CTA 按鈕 (z-50) */}
        <motion.div
          className="absolute bottom-[2%] md:bottom-[2%] inset-x-0 z-50 text-center"
          style={{ opacity: ctaOpacity, y: ctaY }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#5d4037] hover:bg-[#4e342e] text-white px-8 py-3 rounded-full text-lg transition-colors shadow-lg"
          >
            探索產品
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
