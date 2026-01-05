/**
 * Prisma Seed Script
 *
 * 為 Supabase 資料庫填充測試資料
 * 執行: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import {
  FARM_TOUR_IMAGES,
  LOCATION_IMAGES,
  PRODUCT_IMAGES,
} from './seed-images'

// 載入環境變數
config()

// 使用 PostgreSQL adapter 初始化 Prisma Client
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
})
const prisma = new PrismaClient({ adapter })

// ========================================
// 工具函數
// ========================================

/** 取得未來日期 */
function getFutureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

/** 取得隨機元素 */
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ========================================
// 產品資料
// ========================================

const productsData = [
  // === 茶葉類 (6 筆) ===
  {
    name: '阿里山高山烏龍茶',
    description: '來自海拔 1500 公尺以上的阿里山茶區，茶湯清澈金黃，入口回甘，帶有淡淡花香，是台灣高山茶的代表作。採用傳統手工製茶工藝，每一泡都能感受到山林的清新氣息。',
    category: '茶葉',
    price: 1200,
    originalPrice: 1500,
    priceUnit: '包',
    unitQuantity: 150,
    isOnSale: true,
    stock: 50,
    imageKey: 'alishanOolong' as const,
  },
  {
    name: '梅山金萱茶',
    description: '梅山特有的金萱茶種，帶有天然奶香，茶湯滑順不苦澀。適合初次品茶的朋友，也深受老茶客喜愛。冷泡熱沖皆宜，是送禮自用的最佳選擇。',
    category: '茶葉',
    price: 800,
    priceUnit: '包',
    unitQuantity: 150,
    stock: 80,
    imageKey: 'jinxuan' as const,
  },
  {
    name: '日月潭紅玉紅茶',
    description: '台茶18號紅玉，帶有天然肉桂與薄荷香氣，茶湯呈琥珀色澤。南投日月潭特有品種，風味獨特，是台灣紅茶的驕傲。',
    category: '茶葉',
    price: 900,
    originalPrice: 1100,
    priceUnit: '包',
    unitQuantity: 100,
    isOnSale: true,
    stock: 35,
    imageKey: 'sunMoonLake' as const,
  },
  {
    name: '凍頂烏龍茶',
    description: '南投鹿谷凍頂山區的傳統烏龍茶，焙火適中，茶香濃郁持久。具有獨特的「凍頂味」，是台灣最具代表性的烏龍茶之一。',
    category: '茶葉',
    price: 1000,
    priceUnit: '包',
    unitQuantity: 150,
    stock: 45,
    imageKey: 'dongding' as const,
  },
  {
    name: '東方美人茶',
    description: '新竹北埔特產，經小綠葉蟬叮咬後產生獨特蜜香。茶湯呈琥珀色，帶有熟果香氣，是台灣最珍貴的茶種之一。',
    category: '茶葉',
    price: 2200,
    priceUnit: '包',
    unitQuantity: 75,
    stock: 15,
    imageKey: 'orientalBeauty' as const,
  },
  {
    name: '四季春茶',
    description: '一年四季皆可採收的茶種，茶性溫和，清香撲鼻。適合日常飲用，價格親民，是辦公室和家庭常備好茶。',
    category: '茶葉',
    price: 500,
    priceUnit: '包',
    unitQuantity: 150,
    stock: 120,
    imageKey: 'sijichun' as const,
  },

  // === 蜂蜜類 (3 筆) ===
  {
    name: '阿里山野生蜂蜜',
    description: '來自阿里山原始森林的純天然野生蜂蜜，蜜源來自多種野花，無添加、無加工。蜜香濃郁，口感滑順，富含多種營養成分。',
    category: '蜂蜜',
    price: 680,
    originalPrice: 800,
    priceUnit: '罐',
    unitQuantity: 500,
    isOnSale: true,
    stock: 40,
    imageKey: 'wildHoney' as const,
  },
  {
    name: '龍眼蜜',
    description: '台南東山區龍眼花期採收的純龍眼蜜，色澤金黃透亮，香氣馥郁，甜而不膩。是台灣最受歡迎的蜂蜜種類。',
    category: '蜂蜜',
    price: 550,
    priceUnit: '罐',
    unitQuantity: 350,
    stock: 60,
    imageKey: 'honey' as const,
  },
  {
    name: '荔枝蜜',
    description: '高雄大樹荔枝園採收的荔枝蜜，帶有淡淡荔枝果香，口感清爽。夏季限定，數量有限。',
    category: '蜂蜜',
    price: 620,
    priceUnit: '罐',
    unitQuantity: 350,
    stock: 25,
    imageKey: 'honey' as const,
  },

  // === 農產品類 (4 筆) ===
  {
    name: '有機蔬菜箱',
    description: '每週配送新鮮有機蔬菜，內含 8-10 種當季蔬菜，產地直送，新鮮無農藥。支持在地小農，吃得安心又健康。',
    category: '農產品',
    price: 650,
    priceUnit: '箱',
    stock: 100,
    imageKey: 'vegetables' as const,
  },
  {
    name: '梅山紅肉李',
    description: '梅山特產紅肉李，果肉鮮紅多汁，酸甜適中。每年 5-6 月限定採收，錯過等明年。可直接食用或製成果醬、蜜餞。',
    category: '農產品',
    price: 350,
    priceUnit: '斤',
    stock: 200,
    imageKey: 'fruits' as const,
  },
  {
    name: '手工梅子醬',
    description: '使用梅山在地青梅手工熬製，酸甜開胃，可搭配吐司、優格，或作為料理調味。不添加人工色素和防腐劑。',
    category: '農產品',
    price: 280,
    priceUnit: '罐',
    unitQuantity: 300,
    stock: 75,
    imageKey: 'sauces' as const,
  },
  {
    name: '竹筍乾',
    description: '嘉義梅山竹筍經日曬乾燥製成，保留竹筍原有風味。泡發後可燉湯、炒菜，是傳統料理的必備食材。',
    category: '農產品',
    price: 320,
    priceUnit: '包',
    unitQuantity: 200,
    stock: 50,
    imageKey: 'driedGoods' as const,
  },

  // === 手工藝品類 (2 筆) ===
  {
    name: '手工竹編茶盤',
    description: '南投竹山師傅手工編織，採用台灣桂竹，透氣耐用。可作為茶盤或收納盤使用，兼具實用與美觀。',
    category: '手工藝品',
    price: 1800,
    priceUnit: '個',
    stock: 12,
    imageKey: 'teaTray' as const,
  },
  {
    name: '鶯歌陶瓷茶具組',
    description: '新北鶯歌在地陶藝師作品，包含茶壺一只、茶杯四只。釉色溫潤，適合品茶雅士，送禮自用兩相宜。',
    category: '手工藝品',
    price: 3200,
    originalPrice: 3800,
    priceUnit: '組',
    isOnSale: true,
    stock: 8,
    imageKey: 'teaSetProduct' as const,
  },
]

// ========================================
// 農場體驗資料
// ========================================

const farmToursData = [
  {
    name: '春季採茶體驗',
    description: '親手採摘新鮮茶葉，體驗傳統製茶工藝，品嚐現泡好茶。專業茶農帶領，認識茶葉從種植到品飲的完整過程。適合全家大小一起參與的農村體驗活動。',
    date: getFutureDate(7),
    startTime: '09:00',
    endTime: '12:00',
    price: 500,
    maxParticipants: 20,
    currentParticipants: 8,
    location: '梅山茶園',
    imageUrl: FARM_TOUR_IMAGES.teaPicking,
    type: 'harvest' as const,
    tags: ['親子活動', '茶文化', '戶外體驗'],
  },
  {
    name: '手作茶葉蛋工作坊',
    description: '使用農場自產茶葉，學習製作香氣四溢的茶葉蛋。從選茶、調配滷汁到熬煮，完整傳授獨家秘方。可帶回親手製作的成品。',
    date: getFutureDate(14),
    startTime: '14:00',
    endTime: '16:30',
    price: 450,
    maxParticipants: 15,
    currentParticipants: 5,
    location: '豪德製茶所',
    imageUrl: FARM_TOUR_IMAGES.teaEggWorkshop,
    type: 'workshop' as const,
    tags: ['DIY 體驗', '美食', '伴手禮'],
  },
  {
    name: '有機農場生態導覽',
    description: '深入了解有機農業的理念與實踐，參觀農場各區域，認識農作物生長過程。由專業導覽員解說，適合親子共遊和校外教學。',
    date: getFutureDate(10),
    startTime: '10:00',
    endTime: '12:00',
    price: 300,
    maxParticipants: 30,
    currentParticipants: 12,
    location: '梅山有機農場',
    imageUrl: FARM_TOUR_IMAGES.farmTour,
    type: 'tour' as const,
    tags: ['生態教育', '有機農業', '導覽解說'],
  },
  {
    name: '高山茶品茗會',
    description: '品嚐多款阿里山高山茶，由專業茶師講解品茶方法和茶葉知識。在優美的山景中，享受一個悠閒的午後時光。',
    date: getFutureDate(21),
    startTime: '14:00',
    endTime: '16:00',
    price: 600,
    maxParticipants: 12,
    currentParticipants: 4,
    location: '阿里山茶莊',
    imageUrl: FARM_TOUR_IMAGES.teaTasting,
    type: 'tasting' as const,
    tags: ['品茶', '茶文化', '休閒'],
  },
  {
    name: '紅肉李採果體驗',
    description: '每年 5-6 月限定！親自走進果園，採摘新鮮紅肉李。現採現吃，感受水果最純粹的滋味。採摘的水果可帶回家。',
    date: getFutureDate(30),
    startTime: '09:00',
    endTime: '11:30',
    price: 400,
    maxParticipants: 25,
    currentParticipants: 15,
    location: '梅山果園',
    imageUrl: FARM_TOUR_IMAGES.plumPicking,
    type: 'harvest' as const,
    tags: ['採果', '親子', '季節限定'],
  },
  {
    name: '手工果醬製作課程',
    description: '使用當季新鮮水果，學習製作天然果醬。從水果處理、糖度控制到裝瓶保存，完整教學。每人可帶回兩罐親手製作的果醬。',
    date: getFutureDate(18),
    startTime: '13:30',
    endTime: '16:30',
    price: 800,
    maxParticipants: 12,
    currentParticipants: 6,
    location: '豪德製茶所工坊',
    imageUrl: FARM_TOUR_IMAGES.jamWorkshop,
    type: 'workshop' as const,
    tags: ['手作課程', '果醬', '伴手禮'],
  },
  {
    name: '蜂場參觀與蜂蜜品嚐',
    description: '參觀養蜂場，了解蜜蜂的生態和蜂蜜的採收過程。品嚐不同花種的蜂蜜，認識蜂蜜的營養價值。附贈小罐蜂蜜一份。',
    date: getFutureDate(25),
    startTime: '10:00',
    endTime: '12:00',
    price: 350,
    maxParticipants: 20,
    currentParticipants: 10,
    location: '阿里山蜂場',
    imageUrl: FARM_TOUR_IMAGES.honeyTour,
    type: 'tour' as const,
    tags: ['蜂蜜', '生態', '導覽'],
  },
  {
    name: '茶園夕陽攝影之旅',
    description: '在專業攝影師帶領下，漫步茶園，捕捉夕陽餘暉下的茶園美景。適合攝影愛好者，也歡迎初學者參加。',
    date: getFutureDate(35),
    startTime: '15:30',
    endTime: '18:30',
    price: 700,
    maxParticipants: 15,
    currentParticipants: 3,
    location: '梅山茶園觀景台',
    imageUrl: FARM_TOUR_IMAGES.sunsetTour,
    type: 'tour' as const,
    tags: ['攝影', '夕陽', '茶園美景'],
  },
]

// ========================================
// 地點資料
// ========================================

const locationsData = [
  {
    name: '豪德製茶所總部',
    title: '梅山本店 - 總部',
    address: '嘉義縣梅山鄉太和村一鄰八號',
    landmark: '梅山公園旁',
    phone: '05-2561843',
    lineId: '@haudetea',
    hours: '週二至週日 09:00-18:00',
    closedDays: '週一公休（國定假日正常營業）',
    parking: '免費停車場，可容納 30 台車',
    publicTransport: '嘉義客運梅山站下車，步行約 10 分鐘',
    features: ['農產品直銷', '品茶區', '停車場', '無障礙設施'],
    specialties: ['高山茶', '梅子製品', '蜂蜜'],
    lat: 23.5878,
    lng: 120.5569,
    image: LOCATION_IMAGES.headquarters,
    isMain: true,
  },
  {
    name: '阿里山茶莊',
    title: '阿里山分店',
    address: '嘉義縣阿里山鄉中正村 58 號',
    landmark: '阿里山遊客中心附近',
    phone: '05-2679123',
    lineId: '@haudetea-alishan',
    hours: '每日 08:00-17:00',
    closedDays: '無（全年無休）',
    parking: '路邊停車或使用公共停車場',
    publicTransport: '阿里山森林鐵路阿里山站下車',
    features: ['高山茶專賣', '品茶體驗', '茶園導覽預約'],
    specialties: ['阿里山高山茶', '茶葉禮盒'],
    lat: 23.5110,
    lng: 120.8039,
    image: LOCATION_IMAGES.alishanStore,
    isMain: false,
  },
  {
    name: '嘉義市農產直銷站',
    title: '嘉義市區店',
    address: '嘉義市東區中山路 256 號',
    landmark: '嘉義火車站前站步行 5 分鐘',
    phone: '05-2234567',
    lineId: '@haudetea',
    hours: '週一至週六 10:00-20:00',
    closedDays: '週日公休',
    parking: '附近有公共停車場',
    publicTransport: '嘉義火車站前站出口',
    features: ['農產品販售', '禮盒包裝', '宅配服務'],
    specialties: ['全系列茶葉', '蜂蜜', '伴手禮'],
    lat: 23.4791,
    lng: 120.4408,
    image: LOCATION_IMAGES.chiayiStore,
    isMain: false,
  },
  {
    name: '梅山假日農夫市集',
    title: '週六市集攤位',
    address: '嘉義縣梅山鄉中山路市場內 A12 攤位',
    landmark: '梅山市場入口左側',
    phone: '05-2561843',
    lineId: '@haudetea',
    hours: '週六 06:00-12:00',
    closedDays: '週日至週五',
    parking: '市場公共停車場',
    publicTransport: '梅山站下車，步行約 3 分鐘',
    features: ['農產品販售', '現場試吃', '當季特價'],
    specialties: ['當季蔬果', '手工醬料', '農特產品'],
    lat: 23.5856,
    lng: 120.5545,
    image: LOCATION_IMAGES.meishanMarket,
    isMain: false,
  },
  {
    name: '台北希望廣場攤位',
    title: '台北假日市集',
    address: '台北市中正區林森南路 1 號（希望廣場）',
    landmark: '台北車站 M8 出口',
    phone: '05-2561843',
    lineId: '@haudetea',
    hours: '週六、週日 10:00-18:00',
    closedDays: '週一至週五',
    parking: '台北車站地下停車場',
    publicTransport: '捷運台北車站 M8 出口',
    features: ['農產品展售', '試吃試喝', '產地直送'],
    specialties: ['高山茶', '蜂蜜', '梅子製品'],
    lat: 25.0478,
    lng: 121.5170,
    image: LOCATION_IMAGES.taipeiMarket,
    isMain: false,
  },
]

// ========================================
// 行程資料
// ========================================

const schedulesData = [
  {
    title: '梅山假日農夫市集',
    location: '梅山市場 A12 攤位',
    date: getFutureDate(3),
    time: '06:00-12:00',
    products: ['高山茶', '梅子醬', '竹筍乾', '當季蔬果'],
    description: '每週六固定擺攤，提供最新鮮的農產品直銷。歡迎鄉親早起來逛市場！',
    contact: '05-2561843',
    specialOffer: '早鳥優惠：上午 8 點前購買享 9 折',
    weatherNote: '雨天照常營業',
  },
  {
    title: '台北希望廣場展售',
    location: '台北市希望廣場',
    date: getFutureDate(4),
    time: '10:00-18:00',
    products: ['阿里山高山茶', '蜂蜜', '茶葉禮盒'],
    description: '北部朋友購買農產品的好機會，產地直送，品質保證。',
    contact: '05-2561843',
    specialOffer: '滿 2000 元送精美小禮',
  },
  {
    title: '梅山假日農夫市集',
    location: '梅山市場 A12 攤位',
    date: getFutureDate(10),
    time: '06:00-12:00',
    products: ['金萱茶', '龍眼蜜', '手工果醬'],
    description: '本週特別推出新品手工果醬，數量有限！',
    contact: '05-2561843',
    weatherNote: '雨天照常營業',
  },
  {
    title: '嘉義文化中心農產展售會',
    location: '嘉義市文化中心廣場',
    date: getFutureDate(14),
    time: '09:00-17:00',
    products: ['全系列茶葉', '蜂蜜', '農產品'],
    description: '年度大型農產品展售會，多項優惠活動，歡迎闔家光臨。',
    contact: '05-2561843',
    specialOffer: '消費滿額抽獎，大獎茶葉禮盒',
  },
  {
    title: '春季採茶體驗活動',
    location: '梅山茶園',
    date: getFutureDate(7),
    time: '09:00-12:00',
    products: ['春茶', '茶葉體驗包'],
    description: '配合農場體驗活動，現場有茶葉販售和品茗服務。',
    contact: '05-2561843',
  },
  {
    title: '台北希望廣場展售',
    location: '台北市希望廣場',
    date: getFutureDate(11),
    time: '10:00-18:00',
    products: ['凍頂烏龍茶', '荔枝蜜', '梅子製品'],
    description: '週末來希望廣場，品嚐來自嘉義梅山的好滋味。',
    contact: '05-2561843',
    specialOffer: '打卡分享送試飲包',
  },
  {
    title: '梅山假日農夫市集',
    location: '梅山市場 A12 攤位',
    date: getFutureDate(17),
    time: '06:00-12:00',
    products: ['四季春茶', '野生蜂蜜', '有機蔬菜'],
    description: '每週六固定擺攤，這週有新鮮有機蔬菜供應。',
    contact: '05-2561843',
    weatherNote: '雨天照常營業',
  },
  {
    title: '母親節感恩特賣會',
    location: '豪德製茶所總部',
    date: getFutureDate(20),
    time: '09:00-18:00',
    products: ['茶葉禮盒', '蜂蜜禮盒', '陶瓷茶具'],
    description: '母親節前夕感恩特賣，精選禮盒 8 折起，送給媽媽最好的禮物。',
    contact: '05-2561843',
    specialOffer: '禮盒類商品 8 折優惠',
  },
  {
    title: '紅肉李採果季開跑',
    location: '梅山果園',
    date: getFutureDate(30),
    time: '08:00-16:00',
    products: ['紅肉李', '李子醬', '果乾'],
    description: '一年一度紅肉李採果季，歡迎預約採果體驗，現場也有販售。',
    contact: '05-2561843',
    weatherNote: '雨天活動可能調整，請先來電確認',
  },
  {
    title: '台中草悟道市集',
    location: '台中市草悟道廣場',
    date: getFutureDate(25),
    time: '11:00-19:00',
    products: ['精選茶葉', '蜂蜜', '手作點心'],
    description: '首次參加台中草悟道市集，歡迎中部朋友來品茶。',
    contact: '05-2561843',
    specialOffer: '新客戶首購 9 折',
  },
]

// ========================================
// Seed 主函數
// ========================================

async function main() {
  console.log('🌱 開始填充資料...\n')

  // 清除現有資料（可選，開發時方便重置）
  console.log('🗑️  清除現有資料...')
  await prisma.farmTourBooking.deleteMany()
  await prisma.farmTour.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.location.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  console.log('✅ 清除完成\n')

  // 1. 建立產品
  console.log('📦 建立產品資料...')
  for (const productData of productsData) {
    const { imageKey, ...productFields } = productData
    // 根據 imageKey 取得對應的圖片 URL，如果沒有則使用通用茶葉圖
    const imageUrl =
      PRODUCT_IMAGES[imageKey as keyof typeof PRODUCT_IMAGES] ||
      PRODUCT_IMAGES.tea
    const product = await prisma.product.create({
      data: {
        ...productFields,
        images: {
          create: {
            storageUrl: imageUrl,
            filePath: `/products/${productData.name}.jpg`,
            altText: productData.name,
            displayPosition: 0,
            size: 'large',
          },
        },
      },
    })
    console.log(`  ✓ ${product.name}`)
  }
  console.log(`✅ 產品建立完成 (${productsData.length} 筆)\n`)

  // 2. 建立農場體驗
  console.log('🌾 建立農場體驗資料...')
  for (const tourData of farmToursData) {
    const tour = await prisma.farmTour.create({
      data: tourData,
    })
    console.log(`  ✓ ${tour.name}`)
  }
  console.log(`✅ 農場體驗建立完成 (${farmToursData.length} 筆)\n`)

  // 3. 建立地點
  console.log('📍 建立地點資料...')
  for (const locationData of locationsData) {
    const location = await prisma.location.create({
      data: locationData,
    })
    console.log(`  ✓ ${location.name}`)
  }
  console.log(`✅ 地點建立完成 (${locationsData.length} 筆)\n`)

  // 4. 建立行程
  console.log('📅 建立行程資料...')
  for (const scheduleData of schedulesData) {
    const schedule = await prisma.schedule.create({
      data: scheduleData,
    })
    console.log(`  ✓ ${schedule.title}`)
  }
  console.log(`✅ 行程建立完成 (${schedulesData.length} 筆)\n`)

  console.log('🎉 所有資料填充完成！')
  console.log(`
  統計：
  - 產品: ${productsData.length} 筆
  - 農場體驗: ${farmToursData.length} 筆
  - 地點: ${locationsData.length} 筆
  - 行程: ${schedulesData.length} 筆
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed 執行失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
