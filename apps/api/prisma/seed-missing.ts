/**
 * 補充缺失資料腳本
 *
 * 只添加缺失的資料（產品圖片、門市據點、擺攤行程），不刪除現有資料
 * 執行: npx ts-node prisma/seed-missing.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config()

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
})
const prisma = new PrismaClient({ adapter })

// Unsplash 圖片 URL
const UNSPLASH_BASE = 'https://images.unsplash.com'
const PRODUCT_IMAGES = [
  `${UNSPLASH_BASE}/photo-1564890369478-c89ca6d9cde9?w=640&h=360&fit=crop`, // 茶杯
  `${UNSPLASH_BASE}/photo-1544787219-7f47ccb76574?w=640&h=360&fit=crop`, // 茶具
  `${UNSPLASH_BASE}/photo-1558160074-4d7d8bdf4256?w=640&h=360&fit=crop`, // 茶壺
  `${UNSPLASH_BASE}/photo-1530968033775-2c92736b131e?w=640&h=360&fit=crop`, // 茶道
  `${UNSPLASH_BASE}/photo-1576092768241-dec231879fc3?w=640&h=360&fit=crop`, // 中式茶
  `${UNSPLASH_BASE}/photo-1556881286-fc6915169721?w=640&h=360&fit=crop`, // 綠茶
  `${UNSPLASH_BASE}/photo-1563822249548-9a72b6353cd1?w=640&h=360&fit=crop`, // 茶園
  `${UNSPLASH_BASE}/photo-1518568814500-bf0f8d125f46?w=640&h=360&fit=crop`, // 茶葉
  `${UNSPLASH_BASE}/photo-1571934811356-5cc061b6821f?w=640&h=360&fit=crop`, // 果醬
  `${UNSPLASH_BASE}/photo-1597227507333-aceb8dcbf5c6?w=640&h=360&fit=crop`, // 乾貨
  `${UNSPLASH_BASE}/photo-1628619876503-2db74e724757?w=640&h=360&fit=crop`, // 竹筍
  `${UNSPLASH_BASE}/photo-1605651202774-7d573fd3f12d?w=640&h=360&fit=crop`, // 梅子
]

const LOCATION_IMAGES = [
  `${UNSPLASH_BASE}/photo-1555396273-367ea4eb4db5?w=640&h=360&fit=crop`, // 店面
  `${UNSPLASH_BASE}/photo-1559329007-40df8a9345d8?w=640&h=360&fit=crop`, // 茶室
]

function getFutureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

async function main() {
  console.log('🌱 開始補充缺失資料...\n')

  // 1. 為現有產品添加圖片
  console.log('📸 添加產品圖片...')
  const products = await prisma.product.findMany()

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const existingImages = await prisma.productImage.count({
      where: { productId: product.id }
    })

    if (existingImages === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          storageUrl: PRODUCT_IMAGES[i % PRODUCT_IMAGES.length],
          filePath: `products/${product.id}/main.jpg`,
          altText: product.name,
          displayPosition: 0,
          size: 'medium',
        }
      })
      console.log(`  ✅ ${product.name}`)
    } else {
      console.log(`  ⏭️  ${product.name} (已有圖片)`)
    }
  }

  // 2. 建立門市據點
  console.log('\n🏪 建立門市據點...')
  const existingLocations = await prisma.location.count()

  if (existingLocations === 0) {
    const locations = [
      {
        name: '豪德製茶所 - 本店',
        title: '傳統製茶工藝的起點',
        address: '南投縣名間鄉新街村彰南路238號',
        landmark: '名間國小對面',
        phone: '049-2581234',
        hours: '週一至週日 09:00-18:00',
        parking: '門口可停車',
        features: ['免費試飲', '製茶體驗'],
        specialties: ['高山烏龍茶', '紅茶'],
        lat: 23.8389,
        lng: 120.6839,
        isMain: true,
        isActive: true,
      },
      {
        name: '豪德製茶所 - 台中門市',
        title: '台中市區品茗據點',
        address: '台中市西區精誠路100號',
        landmark: '精誠路與大墩路口',
        phone: '04-23012345',
        hours: '週二至週日 10:00-20:00',
        closedDays: '週一',
        parking: '路邊停車',
        features: ['茶藝體驗', '伴手禮包裝'],
        specialties: ['全系列產品'],
        lat: 24.1469,
        lng: 120.6611,
        isMain: false,
        isActive: true,
      },
    ]

    for (const loc of locations) {
      const location = await prisma.location.create({ data: loc })

      // 添加門市圖片
      await prisma.locationImage.create({
        data: {
          locationId: location.id,
          storageUrl: LOCATION_IMAGES[locations.indexOf(loc) % LOCATION_IMAGES.length],
          filePath: `locations/${location.id}/main.jpg`,
          altText: location.name,
          displayPosition: 0,
        }
      })
      console.log(`  ✅ ${location.name}`)
    }
  } else {
    console.log(`  ⏭️  已有 ${existingLocations} 個門市據點`)
  }

  // 3. 建立擺攤行程
  console.log('\n📅 建立擺攤行程...')
  const existingSchedules = await prisma.schedule.count()

  if (existingSchedules === 0) {
    const schedules = [
      {
        title: '台中花博農夫市集',
        location: '台中市后里區后科路',
        date: getFutureDate(3),
        time: '08:00-14:00',
        status: 'upcoming' as const,
        products: ['高山烏龍茶', '蜜香紅茶'],
        description: '每週六固定擺攤，提供試飲和現場購買優惠。',
        isActive: true,
      },
      {
        title: '南投茶博覽會',
        location: '南投縣名間鄉茶藝中心',
        date: getFutureDate(10),
        time: '09:00-17:00',
        status: 'upcoming' as const,
        products: ['新茶系列', '茶具組'],
        description: '年度茶博盛會，展示新茶和製茶工藝。',
        specialOffer: '茶博限定 85 折',
        isActive: true,
      },
      {
        title: '草屯假日市集',
        location: '南投縣草屯鎮中正路',
        date: getFutureDate(7),
        time: '07:00-12:00',
        status: 'upcoming' as const,
        products: ['茶葉', '農產品'],
        description: '週日早市，提供新鮮茶葉和農產品。',
        isActive: true,
      },
    ]

    for (const schedule of schedules) {
      await prisma.schedule.create({ data: schedule })
      console.log(`  ✅ ${schedule.title}`)
    }
  } else {
    console.log(`  ⏭️  已有 ${existingSchedules} 個擺攤行程`)
  }

  console.log('\n✨ 資料補充完成！')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ 執行失敗:', e.message)
  prisma.$disconnect()
  process.exit(1)
})
