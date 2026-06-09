'use client'

/**
 * 滾動驅動泡茶動畫區段 — 方向 A（茶壺／茶杯重塑版）
 *
 * 與原版差異：
 * - Teapot()：扁平圓角色塊 → 圓潤壺身（漸層光影）＋金色蓋鈕與壺緣金線＋漸縮壺嘴＋有握把鏤空的壺把
 * - Teacup()：加金色杯緣、溫潤琥珀茶湯、不透明白瓷托盤
 * - 茶壺最大傾斜由 35° 收斂為 18°（更優雅）
 * - 茶壺與茶杯位置略為拉近
 *
 * 滾動敘事邏輯（scrollYProgress 與各 motion value）與原版完全相同。
 * 器皿改用 inline style 繪製，無需額外 CSS。可直接覆蓋原檔。
 */

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, ArrowRight, Play } from 'lucide-react'
import { motion, useTransform, useReducedMotion, type MotionValue } from 'framer-motion'
import { useElementScroll } from '@/hooks/useElementScroll'

// ===== 子元件：CSS 茶壺（重塑）=====
function Teapot() {
  return (
    <div
      className="scale-[0.62] md:scale-100 origin-bottom"
      style={{ position: 'relative', width: 214, height: 172 }}
    >
      {/* 壺把 — 留出握把鏤空，上下兩端嵌入壺身 */}
      <div
        style={{
          position: 'absolute',
          bottom: 34,
          left: -22,
          width: 46,
          height: 86,
          border: '7px solid #5d4037',
          borderRight: 0,
          borderRadius: '74% 0 0 74%',
          boxShadow: 'inset 3px 0 5px rgba(0,0,0,.22)',
          transform: 'rotate(11deg)',
          transformOrigin: 'right bottom',
        }}
      />
      {/* 壺身 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 182,
          height: 140,
          background:
            'radial-gradient(130% 115% at 32% 22%, #875f4d 0%, #5d4037 48%, #45302a 100%)',
          borderRadius: '48% 48% 46% 46% / 53% 53% 47% 47%',
          boxShadow:
            'inset -16px -12px 28px rgba(0,0,0,.32), inset 12px 10px 20px rgba(255,255,255,.08), 0 18px 30px rgba(62,39,35,.30)',
        }}
      />
      {/* 壺緣金線 */}
      <div
        style={{
          position: 'absolute',
          bottom: 118,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 116,
          height: 10,
          background: '#5d4037',
          borderRadius: '50%',
          boxShadow: '0 3px 0 -1px #d4af37',
        }}
      />
      {/* 壺蓋 */}
      <div
        style={{
          position: 'absolute',
          bottom: 122,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 24,
          background: 'radial-gradient(80% 120% at 42% 8%, #7d5848, #4e342e)',
          borderRadius: '50% 50% 40% 40%',
        }}
      />
      {/* 蓋鈕 ＋ 金頂 */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 20,
          height: 16,
          background: '#4e342e',
          borderRadius: '50% 50% 45% 45%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#d4af37',
          }}
        />
      </div>
      {/* 壺嘴 — 漸縮尖嘴 */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          right: -30,
          width: 54,
          height: 26,
          background: 'linear-gradient(180deg,#6d4c41,#4a332b)',
          transform: 'rotate(-20deg)',
          transformOrigin: 'left center',
          clipPath: 'polygon(0 8%, 100% 34%, 100% 62%, 0 92%)',
        }}
      />
    </div>
  )
}

// ===== 子元件：CSS 茶杯（重塑）=====
function Teacup({ fillHeight }: { fillHeight: MotionValue<string> }) {
  return (
    <div
      className="scale-[0.62] md:scale-100 origin-bottom"
      style={{ position: 'relative', width: 200, height: 150 }}
    >
      {/* 杯碟 — 不透明白瓷 */}
      <div
        style={{
          position: 'absolute',
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 214,
          height: 24,
          background: 'radial-gradient(62% 120% at 50% 0%, #ffffff 0%, #f1e8da 68%, #e2d4c1 100%)',
          borderRadius: '50%',
          boxShadow: '0 12px 22px rgba(62,39,35,.24), inset 0 2px 3px rgba(255,255,255,.85)',
        }}
      />
      {/* 杯身 */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 150,
          height: 116,
          background: 'linear-gradient(160deg,#ffffff,#f3ece2)',
          borderRadius: '14px 14px 46% 46%',
          overflow: 'hidden',
          boxShadow: '0 12px 26px rgba(62,39,35,.18)',
          border: '1px solid rgba(212,175,55,.4)',
        }}
      >
        {/* 茶湯填充 */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: fillHeight,
            background: 'linear-gradient(180deg,#d59a5c,#b9793c)',
          }}
        />
        {/* 金色杯緣 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            zIndex: 3,
            background: 'linear-gradient(90deg,rgba(212,175,55,.2),#d4af37,rgba(212,175,55,.2))',
          }}
        />
      </div>
      {/* 杯把 */}
      <div
        style={{
          position: 'absolute',
          bottom: 42,
          right: 14,
          width: 34,
          height: 54,
          border: '7px solid #f3ece2',
          borderLeft: 0,
          borderRadius: '0 60% 60% 0',
        }}
      />
    </div>
  )
}

// ===== 子元件：蒸氣 =====
function SteamLines() {
  const layers = [
    { width: 'w-32 md:w-40', opacity: 'opacity-40', duration: '4.5s', delay: '0s' },
    { width: 'w-24 md:w-32', opacity: 'opacity-30', duration: '5.5s', delay: '1.2s' },
    { width: 'w-20 md:w-28', opacity: 'opacity-25', duration: '3.8s', delay: '0.6s' },
  ]
  return (
    <div className="relative flex justify-center h-24 md:h-32">
      {layers.map((layer, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src="/images/smoke.svg"
          alt=""
          aria-hidden="true"
          className={`absolute bottom-0 ${layer.width} ${layer.opacity} animate-smoke-rise`}
          style={{ animationDuration: layer.duration, animationDelay: layer.delay }}
        />
      ))}
    </div>
  )
}

// ===== 主元件 =====
export function TeaCeremonySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const [mounted, setMounted] = useState(false)
  const [forceAnimation, setForceAnimation] = useState(false)
  useEffect(() => setMounted(true), [])
  const isReduced = mounted && prefersReducedMotion && !forceAnimation

  const { scrollYProgress } = useElementScroll(containerRef, ['start 80%', 'end end'])

  // 茶葉飄落
  const leaf1Y = useTransform(scrollYProgress, [0, 0.3], ['-3%', '8%'])
  const leaf2Y = useTransform(scrollYProgress, [0.02, 0.35], ['-5%', '6%'])
  const leaf3Y = useTransform(scrollYProgress, [0.05, 0.4], ['-2%', '10%'])
  const leafOpacity = useTransform(scrollYProgress, [0, 0.05, 0.15], [0, 1, 1])

  // 茶壺滑入 + 傾斜倒茶（傾斜收斂為 18°）
  const teapotY = useTransform(scrollYProgress, [0.15, 0.4], ['-80%', '5%'])
  const teapotOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1])
  const teapotRotate = useTransform(scrollYProgress, [0.4, 0.6], [0, 18])

  // 茶杯升起
  const cupY = useTransform(scrollYProgress, [0.3, 0.5], ['60%', '0%'])
  const cupScale = useTransform(scrollYProgress, [0.3, 0.5], [0.8, 1])
  const cupOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1])

  // 茶水填充
  const teaFill = useTransform(scrollYProgress, [0.5, 0.75], ['0%', '85%'])

  // 蒸氣
  const steamOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const steamY = useTransform(scrollYProgress, [0.7, 0.9], ['10px', '-20px'])

  // 文字淡入
  const text1Opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
  const text2Opacity = useTransform(scrollYProgress, [0.3, 0.42], [0, 1])
  const text3Opacity = useTransform(scrollYProgress, [0.65, 0.78], [0, 1])

  // CTA 淡入
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1])
  const ctaY = useTransform(scrollYProgress, [0.85, 0.95], ['20px', '0px'])

  // prefers-reduced-motion：靜態版本
  if (isReduced) {
    return (
      <section ref={containerRef} className="py-24 px-6 bg-[#f8f5f0] dark:bg-[#1a120d]">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-12 h-12 text-[#5d4037] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-4">
            從茶園到茶杯
          </h2>
          <p className="text-[#5d4037] dark:text-[#bcaaa4] text-lg mb-2">
            精選梅山高山茶葉，三代傳承的古法製茶
          </p>
          <p className="text-[#5d4037] dark:text-[#bcaaa4] text-lg mb-8">每一口都是山林的滋味</p>
          <button
            onClick={() => {
              setForceAnimation(true)
              requestAnimationFrame(() => {
                containerRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
              })
            }}
            className="inline-flex items-center gap-2 text-[#5d4037] hover:text-[#3e2723] border border-[#d4af37]/50 hover:border-[#d4af37] px-6 py-2.5 rounded-full text-base transition-colors mb-4"
          >
            <Play className="w-4 h-4" />
            顯示泡茶動畫
          </button>
          <br />
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
    <section ref={containerRef} className="relative h-[200vh] md:h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {/* 背景層 */}
        <div className="absolute inset-0 bg-[#f8f5f0] dark:bg-[#1a120d] z-0">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute top-[10%] left-[5%] w-40 h-40 border border-[#5d4037] rounded-full" />
            <div className="absolute top-[30%] right-[10%] w-60 h-60 border border-[#5d4037] rounded-full" />
            <div className="absolute bottom-[15%] left-[15%] w-32 h-32 border border-[#5d4037] rounded-full" />
          </div>
        </div>

        {/* Text 1 */}
        <motion.div
          className="absolute left-6 md:left-[10%] top-[10%] md:top-[15%] z-30 text-left max-w-[200px] md:max-w-xs"
          style={{ opacity: text1Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            精選梅山高山茶葉
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            海拔一千公尺的純淨風土
          </p>
        </motion.div>

        {/* Text 2 */}
        <motion.div
          className="absolute right-6 md:right-[10%] top-[18%] md:top-[42%] z-30 text-right max-w-[200px] md:max-w-xs"
          style={{ opacity: text2Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            三代傳承的古法製茶
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            以時間與溫度淬煉風味
          </p>
        </motion.div>

        {/* Text 3 */}
        <motion.div
          className="absolute left-6 md:left-[10%] top-[78%] md:top-[68%] z-30 text-left max-w-[200px] md:max-w-xs"
          style={{ opacity: text3Opacity }}
        >
          <h2 className="text-2xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-2">
            每一口都是山林的滋味
          </h2>
          <p className="text-sm md:text-base text-[#5d4037] dark:text-[#bcaaa4]">
            從茶園到您的茶杯
          </p>
        </motion.div>

        {/* 茶葉飄落層 */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          style={{ opacity: leafOpacity }}
        >
          <motion.div className="absolute left-[82%] md:left-[88%] top-[8%]" style={{ y: leaf1Y }}>
            <Leaf className="w-12 h-12 md:w-16 md:h-16 text-[#3e2723] rotate-45" />
          </motion.div>
          <motion.div className="absolute left-[78%] md:left-[85%] top-[32%]" style={{ y: leaf2Y }}>
            <Leaf className="w-10 h-10 md:w-14 md:h-14 text-[#4e342e] -rotate-30" />
          </motion.div>
          <motion.div className="absolute left-[5%] top-[48%]" style={{ y: leaf3Y }}>
            <Leaf className="w-11 h-11 md:w-14 md:h-14 text-[#5d4037] rotate-12" />
          </motion.div>
        </motion.div>

        {/* 茶壺層 — 傾斜以壺嘴為支點 */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 md:-translate-x-[72%] top-[34%] md:top-[24%] z-30 transform-gpu"
          style={{
            y: teapotY,
            opacity: teapotOpacity,
            rotate: teapotRotate,
            transformOrigin: '72% 78%',
          }}
        >
          <Teapot />
        </motion.div>

        {/* 茶杯層 — 拉近壺嘴下方 */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 md:-translate-x-[40%] top-[58%] md:top-[50%] z-40 transform-gpu"
          style={{ y: cupY, scale: cupScale, opacity: cupOpacity }}
        >
          <Teacup fillHeight={teaFill} />
        </motion.div>

        {/* 蒸氣層 */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 md:-translate-x-[40%] top-[55%] md:top-[46%] z-50 w-32 md:w-56 transform-gpu"
          style={{ opacity: steamOpacity, y: steamY }}
        >
          <SteamLines />
        </motion.div>

        {/* CTA 按鈕 */}
        <motion.div
          className="absolute bottom-[1%] md:bottom-[2%] inset-x-0 z-50 text-center"
          style={{ opacity: ctaOpacity, y: ctaY }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#c5a028] text-[#3a2a08] px-8 py-3 rounded-sm text-lg font-semibold transition-colors shadow-lg"
          >
            探索產品
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
