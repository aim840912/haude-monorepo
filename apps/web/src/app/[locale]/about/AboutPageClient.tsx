'use client'

/**
 * 關於我們頁面 — 客戶端元件
 *
 * 使用 IntersectionObserver 實現滾動動畫
 * 內容來源：BrandStorySection + FeatureCards 的擴展版
 */

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sprout,
  ShieldCheck,
  Users,
  Recycle,
  ArrowRight,
  Mountain,
  Leaf,
  Heart,
} from 'lucide-react'

// 品牌故事圖片（複用 constants/images.ts 的 Unsplash 圖片）
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1556881286-fc6915169721?w=1920&h=800&fit=crop'
const STORY_IMAGE_1 =
  'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=800&h=600&fit=crop'
const STORY_IMAGE_2 =
  'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=800&h=600&fit=crop'

// 核心價值資料（擴展自 FeatureCards）
const coreValues = [
  {
    Icon: Sprout,
    title: '自然農法',
    description: '堅持不使用化學農藥與肥料，讓茶樹在最自然的環境生長。以友善土地的方式耕作，保留茶葉最原始的風味與營養。',
    stat: '15+ 年有機認證',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
    darkBgColor: 'dark:bg-[#1b5e20]/20',
  },
  {
    Icon: ShieldCheck,
    title: '品質認證',
    description: '從採摘到包裝，每一道工序都經過嚴格的品質檢驗。產地直送，確保每一片茶葉都符合最高標準。',
    stat: '100% 產地直送',
    iconColor: 'text-[#d35400]',
    bgColor: 'bg-[#fff3e0]',
    darkBgColor: 'dark:bg-[#d35400]/20',
  },
  {
    Icon: Users,
    title: '農場體驗',
    description: '親手採茶、製茶體驗，感受從茶園到茶杯的完整旅程。四季皆有不同的茶園風光與活動安排。',
    stat: '年接待 2000+ 人',
    iconColor: 'text-[#5d4037]',
    bgColor: 'bg-[#efebe9]',
    darkBgColor: 'dark:bg-[#5d4037]/20',
  },
  {
    Icon: Recycle,
    title: '永續經營',
    description: '友善環境的種植方式，維護梅山生態多樣性。從土壤養護到水資源管理，實踐對土地的永續承諾。',
    stat: '零化學殘留',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
    darkBgColor: 'dark:bg-[#1b5e20]/20',
  },
]

export function AboutPageClient() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    )

    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* ===== 1. Hero 橫幅 ===== */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="豪德製茶所梅山茶園"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* 深色遮罩 */}
        <div className="absolute inset-0 bg-[#3e2723]/70" />
        {/* 標題 */}
        <div className="relative z-10 text-center px-6">
          <p className="text-[#d4af37] tracking-[0.3em] text-sm mb-4 uppercase animate-fade-in">
            Our Story
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 animate-fade-in animation-delay-150">
            關於豪德製茶所
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto animate-fade-in animation-delay-300">
            三代傳承，守護梅山最純粹的茶味
          </p>
        </div>
      </section>

      {/* ===== 2. 品牌故事 ===== */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-[#1a120d]">
        <div className="max-w-6xl mx-auto">
          {/* 標題 */}
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-[#d4af37] dark:text-[#ffd54f] tracking-[0.2em] text-sm mb-3 uppercase">
              Brand Story
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-4">
              從梅山群峰到您的茶杯
            </h2>
            <div className="w-16 h-0.5 bg-[#d4af37] mx-auto" />
          </div>

          {/* 故事段落 1 — 三代傳承 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="animate-on-scroll">
              <div className="flex items-center gap-3 mb-6">
                <Mountain className="w-6 h-6 text-[#d4af37] dark:text-[#ffd54f]" />
                <h3 className="text-2xl font-serif text-[#3e2723] dark:text-[#d7ccc8]">
                  三代人的堅持
                </h3>
              </div>
              <div className="space-y-4 text-[#5d4037] dark:text-[#bcaaa4] text-lg leading-relaxed">
                <p>
                  座落嘉義梅山海拔一千公尺的茶園，豪德製茶所以三代人的堅持，
                  守護著這片土地最純粹的風味。從祖父輩開始種茶，到父親精進製茶工藝，
                  再到我們這一代將傳統與現代結合，每一步都凝聚著對茶的熱愛。
                </p>
                <p>
                  梅山得天獨厚的地理環境——終年雲霧繚繞、日夜溫差大、土壤肥沃，
                  造就了獨特的高山茶風味。我們珍惜這片土地的饋贈，
                  用最虔誠的態度對待每一棵茶樹。
                </p>
              </div>
            </div>
            <div className="animate-on-scroll animate-stagger-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src={STORY_IMAGE_1}
                  alt="梅山茶園晨景"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>

          {/* 故事段落 2 — 農法理念（圖左文右） */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="animate-on-scroll order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src={STORY_IMAGE_2}
                  alt="自然農法茶葉特寫"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="animate-on-scroll animate-stagger-2 order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <Leaf className="w-6 h-6 text-[#d4af37] dark:text-[#ffd54f]" />
                <h3 className="text-2xl font-serif text-[#3e2723] dark:text-[#d7ccc8]">
                  自然農法的信念
                </h3>
              </div>
              <div className="space-y-4 text-[#5d4037] dark:text-[#bcaaa4] text-lg leading-relaxed">
                <p>
                  我們相信好茶來自好土地。不使用化學農藥與肥料，
                  讓茶樹在最自然的環境中生長，每一口都是山林的味道。
                </p>
                <p>
                  自然農法不只是一種栽培方式，更是我們對土地的承諾。
                  透過維護生態多樣性、養護土壤健康、珍惜水資源，
                  我們希望這片茶園能夠世代延續，讓後人也能品嚐到梅山的好茶。
                </p>
              </div>
            </div>
          </div>

          {/* 故事段落 3 — 茶園環境 */}
          <div className="animate-on-scroll text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-[#d4af37] dark:text-[#ffd54f]" />
              <h3 className="text-2xl font-serif text-[#3e2723] dark:text-[#d7ccc8]">
                用心製作每一杯好茶
              </h3>
            </div>
            <p className="text-[#5d4037] dark:text-[#bcaaa4] text-lg leading-relaxed">
              從清晨採摘最嫩的茶芽，到日光萎凋、揉捻、烘焙，每一道工序都融入了
              製茶師傅數十年的經驗與心意。我們堅持以傳統手工製茶工藝，
              搭配現代化品管技術，確保每一批茶葉都達到最佳風味。
              這不只是一杯茶，更是梅山土地與匠人心血的結晶。
            </p>
          </div>
        </div>
      </section>

      {/* ===== 3. 核心價值 ===== */}
      <section className="py-20 md:py-28 px-6 bg-[#faf8f5] dark:bg-[#2d1f1a]">
        <div className="max-w-6xl mx-auto">
          {/* 標題 */}
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-[#d4af37] dark:text-[#ffd54f] tracking-[0.2em] text-sm mb-3 uppercase">
              Core Values
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-[#3e2723] dark:text-[#d7ccc8] mb-4">
              我們的核心價值
            </h2>
            <div className="w-16 h-0.5 bg-[#d4af37] mx-auto" />
          </div>

          {/* 4 張價值卡片 */}
          <div className="grid md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <div
                key={value.title}
                className={`animate-on-scroll animate-stagger-${index + 1} tea-card bg-white dark:bg-[#3e2723] rounded-2xl p-8`}
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 ${value.bgColor} ${value.darkBgColor} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <value.Icon
                      className={`w-7 h-7 ${value.iconColor}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-2">
                      {value.title}
                    </h3>
                    <p className="text-[#5d4037] dark:text-[#bcaaa4] leading-relaxed mb-3">
                      {value.description}
                    </p>
                    <p className="text-[#d4af37] dark:text-[#ffd54f] font-bold text-sm">
                      {value.stat}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. CTA ===== */}
      <section className="py-20 md:py-28 px-6 bg-[#3e2723] text-white">
        <div className="max-w-4xl mx-auto text-center animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            品嚐梅山的味道
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            從三代傳承的茶園到您的茶杯，每一口都是自然與匠心的結晶。
            探索我們的茶品，或親自來梅山感受茶園的美好。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-3 bg-[#d4af37] hover:bg-[#c5a028] text-[#3e2723] font-bold rounded-xl transition-colors"
            >
              探索茶品
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/farm-tours"
              className="inline-flex items-center px-8 py-3 border border-white/30 hover:border-white/60 text-white rounded-xl transition-colors"
            >
              預約農場參觀
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
