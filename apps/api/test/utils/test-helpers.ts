/**
 * 測試工具函數
 * 提供共用的 mock 工廠和測試資料生成器
 */

import { MemberLevel, OrderStatus, Role } from '@prisma/client';

/**
 * 建立 Mock Prisma Service
 */
export function createMockPrismaService() {
  return {
    // User
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Order
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },

    // OrderItem
    orderItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },

    // Product
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },

    // ProductImage
    productImage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },

    // Payment
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },

    // PasswordResetToken
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },

    // Transaction
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(createMockPrismaService());
      }
      return Promise.all(callback);
    }),
  };
}

/**
 * 建立 Mock User
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  password: string | null;
  role: Role;
  memberLevel: MemberLevel;
  totalSpent: number;
  isActive: boolean;
  googleId: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: '測試使用者',
    password: '$2b$10$hashed_password',
    role: 'USER' as Role,
    memberLevel: 'NORMAL' as MemberLevel,
    totalSpent: 0,
    isActive: true,
    googleId: null,
    avatar: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 建立 Mock Product
 */
export function createMockProduct(overrides: Partial<{
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceUnit: string;
  unitQuantity: number | null;
  originalPrice: number | null;
  isOnSale: boolean;
  stock: number;
  reservedStock: number;
  isActive: boolean;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{
    id: string;
    storageUrl: string;
    displayPosition: number;
  }>;
}> = {}) {
  return {
    id: 'product-1',
    name: '測試產品',
    description: '這是測試產品描述',
    category: '茶葉',
    price: 500,
    priceUnit: '75g',
    unitQuantity: 75,
    originalPrice: null,
    isOnSale: false,
    stock: 100,
    reservedStock: 0,
    isActive: true,
    isDraft: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    images: [
      {
        id: 'image-1',
        storageUrl: 'https://example.com/image.jpg',
        displayPosition: 0,
      },
    ],
    ...overrides,
  };
}

/**
 * 建立 Mock Order
 */
export function createMockOrder(overrides: Partial<{
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: object;
  paymentMethod: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-20240115-001',
    userId: 'user-1',
    status: 'pending' as OrderStatus,
    paymentStatus: 'pending',
    subtotal: 1000,
    shippingFee: 60,
    tax: 0,
    discountAmount: 0,
    totalAmount: 1060,
    shippingAddress: {
      name: '測試收件人',
      phone: '0912345678',
      city: '台北市',
      street: '測試路 100 號',
      postalCode: '100',
    },
    paymentMethod: 'CREDIT',
    trackingNumber: null,
    notes: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: '測試產品',
        quantity: 2,
        unitPrice: 500,
        subtotal: 1000,
      },
    ],
    ...overrides,
  };
}

/**
 * 建立 Mock CreateOrderDto
 */
export function createMockCreateOrderDto(overrides: Partial<{
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    street: string;
    postalCode: string;
  };
  paymentMethod: string;
  discountCode?: string;
  notes?: string;
}> = {}) {
  return {
    items: [{ productId: 'product-1', quantity: 2 }],
    shippingAddress: {
      name: '測試收件人',
      phone: '0912345678',
      city: '台北市',
      street: '測試路 100 號',
      postalCode: '100',
    },
    paymentMethod: 'CREDIT',
    ...overrides,
  };
}

/**
 * 建立 Mock Email Service
 */
export function createMockEmailService() {
  return {
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendShippingNotificationEmail: jest.fn().mockResolvedValue(true),
    sendPaymentSuccessEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  };
}

/**
 * 建立 Mock Config Service
 */
export function createMockConfigService(config: Record<string, string> = {}) {
  const defaultConfig = {
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '7d',
    FRONTEND_URL: 'http://localhost:5173',
    ADMIN_URL: 'http://localhost:5174',
  };

  return {
    get: jest.fn((key: string) => ({ ...defaultConfig, ...config })[key]),
  };
}

/**
 * 建立 Mock JWT Service
 */
export function createMockJwtService() {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
  };
}

/**
 * 建立 Mock Discounts Service
 */
export function createMockDiscountsService() {
  return {
    validateDiscountCode: jest.fn().mockResolvedValue({
      valid: true,
      discountAmount: 100,
      code: 'TEST10',
    }),
    applyDiscount: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * 建立 Mock Members Service
 */
export function createMockMembersService() {
  return {
    getLevelConfig: jest.fn().mockResolvedValue({
      level: 'NORMAL',
      discountPercent: 0,
      freeShipping: false,
      pointsMultiplier: 1,
    }),
    updateTotalSpentAndCheckUpgrade: jest.fn().mockResolvedValue({ upgraded: false }),
    addPointsForPurchase: jest.fn().mockResolvedValue(10),
  };
}

/**
 * 建立 Mock Supabase Service
 */
export function createMockSupabaseService() {
  return {
    createSignedUploadUrl: jest.fn().mockResolvedValue({
      signedUrl: 'https://example.com/upload-url',
      path: 'product-1/image.jpg',
    }),
    getPublicUrl: jest.fn().mockReturnValue('https://example.com/public-url'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
}
