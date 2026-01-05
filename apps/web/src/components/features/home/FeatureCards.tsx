/**
 * 農場特色 3D 翻轉卡片
 * 正面顯示圖示和標題，背面顯示背景圖片
 */

import { Sprout, ShieldCheck, Users, Recycle } from 'lucide-react'

interface FeatureCardsProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
  isVisible: boolean
}

const features = [
  {
    Icon: Sprout,
    title: '自然農法',
    desc: '有機無毒栽培',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
  },
  {
    Icon: ShieldCheck,
    title: '品質認證',
    desc: '嚴格品質把關',
    iconColor: 'text-[#d35400]',
    bgColor: 'bg-[#fff3e0]',
  },
  {
    Icon: Users,
    title: '農場體驗',
    desc: '四季活動豐富',
    iconColor: 'text-[#5d4037]',
    bgColor: 'bg-[#efebe9]',
  },
  {
    Icon: Recycle,
    title: '永續經營',
    desc: '生態平衡共生',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
  },
]

export function FeatureCards({
  activeFeature,
  onFeatureClick,
  featureImages,
  isVisible,
}: FeatureCardsProps) {
  return (
    <div
      className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 ${
        isVisible ? 'animate-fade-in' : 'opacity-0'
      }`}
    >
      {features.map((feature, index) => {
        const isFlipped = activeFeature === index

        return (
          <div
            key={index}
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            onClick={() => onFeatureClick(isFlipped ? -1 : index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onFeatureClick(isFlipped ? -1 : index)
              }
            }}
            style={{ animationDelay: `${index * 100}ms` }}
            tabIndex={0}
            role="button"
            aria-pressed={isFlipped}
            aria-label={`${feature.title}: ${feature.desc}。${
              isFlipped ? '按下以返回正面' : '按下以查看更多'
            }`}
          >
            <div className="flip-card-inner">
              {/* 卡片正面 */}
              <div className="flip-card-front bg-white dark:bg-[#2d1f1a] shadow-lg flex flex-col items-center justify-center text-center p-6">
                <div className={`w-16 h-16 ${feature.bgColor} dark:bg-opacity-20 rounded-full flex items-center justify-center mb-4`}>
                  <feature.Icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </div>

              {/* 卡片背面 */}
              <div
                className="flip-card-back shadow-lg"
                style={{
                  backgroundImage: featureImages[index]
                    ? `url(${featureImages[index]})`
                    : `linear-gradient(135deg, #3e2723 0%, #5d4037 100%)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* 遮罩層 */}
                <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                {/* 內容 */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
                  <feature.Icon className="w-12 h-12 text-white mb-3" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80 text-sm">{feature.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
