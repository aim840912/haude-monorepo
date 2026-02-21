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
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'order-mock-id',
        orderNumber: 'ORD-MOCK-001',
        userId: 'user-1',
        status: 'pending',
        subtotal: 1000,
        shippingFee: 60,
        tax: 0,
        discountAmount: 0,
        totalAmount: 1060,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
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
      findMany: jest.fn().mockResolvedValue([]), // 默認返回空陣列避免 .map() 錯誤
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }), // 默認返回成功更新
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
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

    // RefreshToken
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({
        id: 'refresh-token-1',
        userId: 'user-1',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      }),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },

    // PasswordResetToken
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },

    // Cart
    cart: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // CartItem
    cartItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },

    // FarmTour
    farmTour: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // FarmTourBooking
    farmTourBooking: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // FarmTourImage
    farmTourImage: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },

    // Location
    location: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // LocationImage
    locationImage: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },

    // DiscountCode
    discountCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // DiscountUsage
    discountUsage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },

    // Payment (完整版本，包含 aggregate 和 count)
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(),
    },

    // PaymentLog
    paymentLog: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // Review
    review: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(),
    },

    // Member
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },

    // Schedule
    schedule: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // Notification
    notification: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },

    // StockAlertSetting
    stockAlertSetting: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },

    // SocialPost
    socialPost: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
    },

    // SearchHistory (for trending searches)
    searchHistory: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
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
export function createMockUser(
  overrides: Partial<{
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
    failedLoginAttempts: number;
    lockedUntil: Date | null;
  }> = {},
) {
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
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

/**
 * 建立 Mock Product
 */
export function createMockProduct(
  overrides: Partial<{
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
  }> = {},
) {
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
export function createMockOrder(
  overrides: Partial<{
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
  }> = {},
) {
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
export function createMockCreateOrderDto(
  overrides: Partial<{
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
  }> = {},
) {
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
    verify: jest
      .fn()
      .mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
  };
}

/**
 * 建立 Mock Discounts Service
 */
export function createMockDiscountsService() {
  return {
    // Query Operations
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    validateDiscountCode: jest.fn().mockResolvedValue({
      valid: true,
      discountAmount: 100,
      code: 'TEST10',
    }),
    // Command Operations
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    applyDiscount: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * 建立 Mock Members Service
 */
export function createMockMembersService() {
  return {
    // User-facing methods
    getLevelInfo: jest.fn().mockResolvedValue({
      level: 'NORMAL',
      discountPercent: 0,
      freeShipping: false,
      pointsMultiplier: 1,
    }),
    getUpgradeProgress: jest.fn().mockResolvedValue({
      currentLevel: 'NORMAL',
      nextLevel: 'SILVER',
      progress: 0,
      remainingAmount: 5000,
    }),
    getPointsBalance: jest.fn().mockResolvedValue({
      balance: 100,
    }),
    getPointsHistory: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
    }),
    getAllLevelConfigs: jest.fn().mockResolvedValue([]),
    // Admin methods
    getAdminMembersList: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
    }),
    getMemberDetail: jest.fn().mockResolvedValue(null),
    getMemberLevelHistory: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
    }),
    adjustMemberLevel: jest.fn().mockResolvedValue({}),
    adjustMemberPoints: jest.fn().mockResolvedValue({}),
    // Order-related methods (used by OrdersService)
    getLevelConfig: jest.fn().mockResolvedValue({
      level: 'NORMAL',
      discountPercent: 0,
      freeShipping: false,
      pointsMultiplier: 1,
    }),
    updateTotalSpentAndCheckUpgrade: jest
      .fn()
      .mockResolvedValue({ upgraded: false }),
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


/**
 * 建立 Mock Cart
 */
export function createMockCart(
  overrides: Partial<{
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      cartId: string;
      productId: string;
      quantity: number;
      createdAt: Date;
      product: {
        id: string;
        name: string;
        price: number;
        priceUnit: string;
        stock: number;
        images: Array<{ storageUrl: string }>;
      };
    }>;
  }> = {},
) {
  return {
    id: 'cart-1',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    items: [
      {
        id: 'cart-item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        createdAt: new Date('2024-01-01'),
        product: {
          id: 'product-1',
          name: '測試產品',
          price: 500,
          priceUnit: '75g',
          stock: 100,
          images: [{ storageUrl: 'https://example.com/image.jpg' }],
        },
      },
    ],
    ...overrides,
  };
}

/**
 * 建立 Mock Cart Item
 */
export function createMockCartItem(
  overrides: Partial<{
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'cart-item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    quantity: 1,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 建立 Mock Discount Code
 */
export function createMockDiscountCode(
  overrides: Partial<{
    id: string;
    code: string;
    description: string | null;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usageCount: number;
    perUserLimit: number;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    usages: Array<{ userId: string }>;
    _count: { usages: number };
  }> = {},
) {
  return {
    id: 'discount-1',
    code: 'TEST10',
    description: '測試折扣碼',
    discountType: 'PERCENTAGE' as const,
    discountValue: 10,
    minOrderAmount: null,
    maxDiscount: null,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: 1,
    startDate: null,
    endDate: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    usages: [],
    _count: { usages: 0 },
    ...overrides,
  };
}

/**
 * 建立 Mock Payment
 */
export function createMockPayment(
  overrides: Partial<{
    id: string;
    orderId: string;
    merchantOrderNo: string;
    tradeNo: string | null;
    amount: number;
    paymentType: string;
    status: 'pending' | 'paid' | 'failed';
    requestData: object | null;
    responseData: object | null;
    payTime: Date | null;
    bankCode: string | null;
    vaAccount: string | null;
    paymentCode: string | null;
    expireDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    order: object | null;
  }> = {},
) {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    merchantOrderNo: 'HAU20240115001',
    tradeNo: null,
    amount: 1060,
    paymentType: 'CREDIT',
    status: 'pending' as const,
    requestData: null,
    responseData: null,
    payTime: null,
    bankCode: null,
    vaAccount: null,
    paymentCode: null,
    expireDate: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    order: null,
    ...overrides,
  };
}

/**
 * 建立 Mock Payment Log
 */
export function createMockPaymentLog(
  overrides: Partial<{
    id: string;
    paymentId: string | null;
    merchantOrderNo: string;
    logType: string;
    rawData: object;
    verified: boolean;
    processed: boolean;
    ipAddress: string | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'log-1',
    paymentId: 'payment-1',
    merchantOrderNo: 'HAU20240115001',
    logType: 'notify',
    rawData: {},
    verified: true,
    processed: true,
    ipAddress: '127.0.0.1',
    createdAt: new Date('2024-01-15'),
    ...overrides,
  };
}

/**
 * 建立 Mock Review
 */
export function createMockReview(
  overrides: Partial<{
    id: string;
    userId: string;
    productId: string;
    orderId: string | null;
    rating: number;
    title: string | null;
    content: string | null;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
    product: {
      id: string;
      name: string;
    } | null;
  }> = {},
) {
  return {
    id: 'review-1',
    userId: 'user-1',
    productId: 'product-1',
    orderId: 'order-1',
    rating: 5,
    title: '很棒的產品',
    content: '品質很好，推薦購買！',
    isApproved: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    user: {
      id: 'user-1',
      name: '測試使用者',
      avatar: null,
    },
    product: {
      id: 'product-1',
      name: '測試產品',
    },
    ...overrides,
  };
}

/**
 * 建立 Mock Member
 */
export function createMockMember(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    memberLevel: MemberLevel;
    totalSpent: number;
    points: number;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'member-1',
    name: '測試會員',
    email: 'member@example.com',
    memberLevel: 'NORMAL' as MemberLevel,
    totalSpent: 0,
    points: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 建立 Mock FarmTour
 */
export function createMockFarmTour(
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    date: Date;
    startTime: string;
    duration: number;
    maxParticipants: number;
    currentParticipants: number;
    price: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    bookings: Array<{
      id: string;
      userId: string;
      participants: number;
      status: string;
    }>;
  }> = {},
) {
  return {
    id: 'farm-tour-1',
    name: '茶園體驗之旅',
    description: '體驗茶園採摘與製茶過程',
    date: new Date('2024-03-15'),
    startTime: '09:00',
    duration: 180,
    maxParticipants: 20,
    currentParticipants: 5,
    price: 1500,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    bookings: [],
    ...overrides,
  };
}

/**
 * 建立 Mock FarmTour Booking
 */
export function createMockBooking(
  overrides: Partial<{
    id: string;
    tourId: string;
    userId: string;
    participants: number;
    status: 'confirmed' | 'cancelled' | 'pending';
    contactName: string;
    contactPhone: string;
    note: string | null;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    farmTour: object | null;
    user: object | null;
  }> = {},
) {
  return {
    id: 'booking-1',
    tourId: 'farm-tour-1',
    userId: 'user-1',
    participants: 2,
    status: 'confirmed' as const,
    contactName: '測試聯絡人',
    contactPhone: '0912345678',
    note: null,
    totalAmount: 3000,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    farmTour: null,
    user: null,
    ...overrides,
  };
}

/**
 * 建立 Mock Location
 */
export function createMockLocation(
  overrides: Partial<{
    id: string;
    name: string;
    address: string;
    phone: string | null;
    openingHours: string | null;
    mapUrl: string | null;
    description: string | null;
    isMain: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    images: Array<{
      id: string;
      storageUrl: string;
      displayPosition: number;
    }>;
  }> = {},
) {
  return {
    id: 'location-1',
    name: '豪德製茶所總店',
    address: '南投縣竹山鎮集山路三段 123 號',
    phone: '049-2630000',
    openingHours: '週一至週日 09:00-18:00',
    mapUrl: 'https://maps.google.com/?q=...',
    description: '我們的總店位於南投竹山',
    isMain: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    images: [],
    ...overrides,
  };
}

/**
 * 建立 Mock Schedule
 */
export function createMockSchedule(
  overrides: Partial<{
    id: string;
    title: string;
    location: string;
    date: Date;
    time: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'schedule-1',
    title: '春茶上市',
    location: '總店',
    date: new Date('2024-04-01'),
    time: '09:00',
    description: '今年的春茶正式開賣',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 建立 Mock Notification
 */
export function createMockNotification(
  overrides: Partial<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    data: object | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'notification-1',
    type: 'NEW_ORDER',
    title: '新訂單通知',
    message: '您有一筆新訂單 ORD-20240115-001',
    isRead: false,
    data: { orderId: 'order-1' },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

/**
 * 建立 Mock SocialPost
 */
export function createMockSocialPost(
  overrides: Partial<{
    id: string;
    platform: 'facebook' | 'instagram';
    url: string;
    title: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'social-post-1',
    platform: 'instagram' as const,
    url: 'https://www.instagram.com/p/abc123/',
    title: '新品上市',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 建立 Mock StockAlertSetting
 */
export function createMockStockAlertSetting(
  overrides: Partial<{
    id: string;
    productId: string;
    threshold: number;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    product: object | null;
  }> = {},
) {
  return {
    id: 'stock-alert-1',
    productId: 'product-1',
    threshold: 10,
    isEnabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    product: null,
    ...overrides,
  };
}
