import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 通用 API 回應 DTO
 */
export class MessageResponseDto {
  @ApiProperty({ description: '回應訊息', example: '操作成功' })
  message: string;
}

/**
 * 分頁資訊 DTO
 */
export class PaginationMeta {
  @ApiProperty({ description: '總筆數', example: 100 })
  total: number;

  @ApiProperty({ description: '當前頁碼', example: 1 })
  page: number;

  @ApiProperty({ description: '每頁筆數', example: 10 })
  limit: number;

  @ApiProperty({ description: '是否有更多資料', example: true })
  hasMore: boolean;
}

/**
 * 分頁回應 DTO（泛型）
 * 用於包含分頁資訊的列表回應
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '資料列表', isArray: true })
  data: T[];

  @ApiProperty({ description: '總筆數', example: 100 })
  total: number;

  @ApiPropertyOptional({ description: '是否有更多資料', example: true })
  hasMore?: boolean;
}

/**
 * 認證回應 DTO - 登入/註冊成功
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT 存取令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '使用者資訊',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: '王小明',
      role: 'USER',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * 使用者資訊回應 DTO
 */
export class UserResponseDto {
  @ApiProperty({
    description: '使用者 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '姓名', example: '王小明' })
  name: string;

  @ApiProperty({ description: '角色', example: 'USER', enum: ['USER', 'VIP', 'STAFF', 'ADMIN'] })
  role: string;

  @ApiProperty({ description: '是否啟用', example: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Google ID', example: '123456789' })
  googleId?: string;

  @ApiPropertyOptional({ description: '頭像 URL', example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({
    description: '會員等級',
    example: 'NORMAL',
    enum: ['NORMAL', 'BRONZE', 'SILVER', 'GOLD'],
  })
  memberLevel: string;

  @ApiProperty({ description: '累積消費（元）', example: 5000 })
  totalSpent: number;

  @ApiProperty({ description: '當前積分', example: 500 })
  currentPoints: number;

  @ApiProperty({ description: '建立時間', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

/**
 * 產品回應 DTO
 */
export class ProductResponseDto {
  @ApiProperty({
    description: '產品 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: '產品名稱', example: '阿里山高山茶' })
  name: string;

  @ApiProperty({ description: '產品描述', example: '來自海拔 1500 公尺的高山茶園...' })
  description: string;

  @ApiProperty({ description: '分類', example: '烏龍茶' })
  category: string;

  @ApiProperty({ description: '價格（元）', example: 800 })
  price: number;

  @ApiPropertyOptional({ description: '價格單位', example: '斤' })
  priceUnit?: string;

  @ApiPropertyOptional({ description: '原價（元）', example: 1000 })
  originalPrice?: number;

  @ApiProperty({ description: '是否特價中', example: true })
  isOnSale: boolean;

  @ApiProperty({ description: '庫存', example: 50 })
  stock: number;

  @ApiProperty({ description: '是否啟用', example: true })
  isActive: boolean;

  @ApiProperty({ description: '是否為草稿', example: false })
  isDraft: boolean;

  @ApiProperty({ description: '產品圖片', isArray: true })
  images: ProductImageDto[];

  @ApiProperty({ description: '建立時間', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新時間', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

/**
 * 產品圖片 DTO
 */
export class ProductImageDto {
  @ApiProperty({ description: '圖片 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: '圖片 URL', example: 'https://example.com/image.jpg' })
  storageUrl: string;

  @ApiPropertyOptional({ description: '替代文字', example: '阿里山高山茶包裝' })
  altText?: string;

  @ApiProperty({ description: '顯示順序', example: 0 })
  displayPosition: number;
}

/**
 * 訂單回應 DTO
 */
export class OrderResponseDto {
  @ApiProperty({
    description: '訂單 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: '訂單編號', example: 'ORD-20240101-001' })
  orderNumber: string;

  @ApiProperty({
    description: '訂單狀態',
    example: 'pending',
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
  })
  status: string;

  @ApiProperty({ description: '小計（元）', example: 1600 })
  subtotal: number;

  @ApiProperty({ description: '運費（元）', example: 100 })
  shippingFee: number;

  @ApiProperty({ description: '折扣金額（元）', example: 100 })
  discountAmount: number;

  @ApiProperty({ description: '總金額（元）', example: 1600 })
  totalAmount: number;

  @ApiProperty({
    description: '付款狀態',
    example: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded', 'expired'],
  })
  paymentStatus: string;

  @ApiPropertyOptional({ description: '付款方式', example: 'CREDIT' })
  paymentMethod?: string;

  @ApiProperty({ description: '配送地址' })
  shippingAddress: object;

  @ApiPropertyOptional({ description: '折扣碼', example: 'SUMMER2024' })
  discountCode?: string;

  @ApiPropertyOptional({ description: '備註', example: '請在下午 2 點前送達' })
  notes?: string;

  @ApiPropertyOptional({ description: '物流追蹤號', example: '1234567890' })
  trackingNumber?: string;

  @ApiProperty({ description: '訂單項目', isArray: true })
  items: OrderItemDto[];

  @ApiProperty({ description: '建立時間', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新時間', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

/**
 * 訂單項目 DTO
 */
export class OrderItemDto {
  @ApiProperty({ description: '項目 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: '產品 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ description: '產品名稱', example: '阿里山高山茶' })
  productName: string;

  @ApiPropertyOptional({ description: '產品圖片', example: 'https://example.com/image.jpg' })
  productImage?: string;

  @ApiProperty({ description: '數量', example: 2 })
  quantity: number;

  @ApiProperty({ description: '單價（元）', example: 800 })
  unitPrice: number;

  @ApiProperty({ description: '小計（元）', example: 1600 })
  subtotal: number;
}

/**
 * 統一錯誤回應 DTO
 * 所有 API 錯誤都遵循此格式，便於前端程式化處理
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP 狀態碼',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: '錯誤代碼 - 用於前端程式化處理',
    example: 'VALIDATION_ERROR',
  })
  errorCode: string;

  @ApiProperty({
    description: '錯誤訊息 - 人類可讀的描述',
    example: '請求參數錯誤',
  })
  message: string;

  @ApiProperty({
    description: '時間戳記',
    example: '2026-01-17T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: '請求路徑',
    example: '/api/v1/products',
  })
  path: string;
}
