'use client'

/**
 * 訂閱 CTA 區段 — 方向 A
 *
 * 與原版差異：
 * - 移除三片裝飾性漂浮茶葉（純裝飾）
 * - 訂閱按鈕由 off-brand 橘 #d35400 改為品牌金 accent-gold（深褐字）
 * - 移除 animate-pulse-glow 呼吸光暈
 * - 標題下加一條金色細線，沉穩收斂
 *
 * 保留：深茶褐背景、email 表單邏輯、農場參觀連結、Framer Motion 入場。
 */

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem, viewportConfig, spring } from '@/lib/motion'

export function CTASection() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    alert('感謝訂閱！此功能即將上線。')
    setEmail('')
  }

  return (
    <section className="relative py-24 px-6 bg-[#3e2723] text-white overflow-hidden">
      <motion.div
        variants={staggerContainer(0.15, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <motion.p
          variants={staggerItem}
          className="text-xs tracking-[0.34em] uppercase text-[#d4af37] mb-4"
        >
          Stay in touch
        </motion.p>

        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif mb-5">
          體驗梅山的味道
        </motion.h2>

        <motion.span
          variants={staggerItem}
          className="block w-14 h-px bg-[#d4af37]/70 mx-auto mb-6"
        />

        <motion.p variants={staggerItem} className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
          訂閱通訊，獲得季節限定優惠與農場最新動態
        </motion.p>

        {/* Email 訂閱 */}
        <motion.form
          variants={staggerItem}
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="pl-12 pr-4 py-3 rounded-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 w-full sm:w-80 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="bg-[#d4af37] hover:bg-[#c5a028] text-[#3a2a08] px-8 py-3 rounded-sm font-semibold transition-colors"
          >
            訂閱
          </motion.button>
        </motion.form>

        {/* 農場參觀 CTA */}
        <motion.div variants={staggerItem}>
          <Link
            href="/farm-tours"
            className="inline-flex items-center text-[#d4af37] hover:text-[#ffd54f] transition-colors"
          >
            <MapPin className="w-5 h-5 mr-2" />
            或者，來農場走走吧
            <span className="ml-1">&rarr;</span>
          </Link>
        </motion.div>

        <motion.p variants={staggerItem} className="text-white/40 text-xs mt-6">
          不發送垃圾郵件。隨時取消訂閱。
        </motion.p>
      </motion.div>
    </section>
  )
}
