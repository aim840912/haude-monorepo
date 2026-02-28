import { Test, TestingModule } from '@nestjs/testing';
import {
  OrdersController,
  AdminOrdersController,
  AdminDashboardController,
} from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';

/**
 * OrdersController 測試
 *
 * 測試使用者訂單相關的 API 端點：
 * - 取得訂單列表
 * - 建立訂單
 * - 取得訂單詳情
 * - 取消訂單
 */
describe('OrdersController', () => {
  let controller: OrdersController;

  // Mock OrdersService
  const mockOrdersService = {
    getUserOrders: jest.fn(),
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
  };

  // Mock Request
  const mockRequest = {
    user: { userId: 'user-1', email: 'test@example.com' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 OrdersController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getUserOrders 測試
  // ========================================

  describe('getUserOrders', () => {
    const ordersResult = {
      items: [
        { id: 'order-1', status: OrderStatus.pending, totalAmount: 1500 },
        { id: 'order-2', status: OrderStatus.confirmed, totalAmount: 2500 },
      ],
      total: 2,
    };

    it('應回傳使用者訂單列表', async () => {
      mockOrdersService.getUserOrders.mockResolvedValue(ordersResult);

      const result = await controller.getUserOrders(mockRequest, 20, 0);

      expect(result).toEqual(ordersResult);
      expect(mockOrdersService.getUserOrders).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
    });

    it('應支援自訂分頁參數', async () => {
      mockOrdersService.getUserOrders.mockResolvedValue({
        items: [],
        total: 0,
      });

      await controller.getUserOrders(mockRequest, 50, 100);

      expect(mockOrdersService.getUserOrders).toHaveBeenCalledWith(
        'user-1',
        50,
        100,
      );
    });
  });

  // ========================================
  // createOrder 測試
  // ========================================

  describe('createOrder', () => {
    const createOrderDto = {
      items: [{ productId: 'product-1', quantity: 2 }],
      shippingAddress: {
        name: '測試用戶',
        phone: '0912345678',
        street: '測試區測試路100號',
        city: '台北市',
        postalCode: '100',
      },
      paymentMethod: 'CREDIT',
    };

    it('應成功建立訂單', async () => {
      const createdOrder = {
        id: 'order-new',
        status: OrderStatus.pending,
        totalAmount: 3000,
        items: createOrderDto.items,
      };
      mockOrdersService.createOrder.mockResolvedValue(createdOrder);

      const result = await controller.createOrder(mockRequest, createOrderDto);

      expect(result).toEqual(createdOrder);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
        'user-1',
        createOrderDto,
      );
    });
  });

  // ========================================
  // getOrderById 測試
  // ========================================

  describe('getOrderById', () => {
    it('應回傳訂單詳情', async () => {
      const orderDetail = {
        id: 'order-1',
        status: OrderStatus.confirmed,
        totalAmount: 5000,
        items: [{ productId: 'product-1', quantity: 1, price: 5000 }],
        shippingAddress: { name: '測試用戶', address: '台北市' },
        createdAt: new Date(),
      };
      mockOrdersService.getOrderById.mockResolvedValue(orderDetail);

      const result = await controller.getOrderById(mockRequest, 'order-1');

      expect(result).toEqual(orderDetail);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(
        'order-1',
        'user-1',
      );
    });
  });

  // ========================================
  // cancelOrder 測試
  // ========================================

  describe('cancelOrder', () => {
    it('應成功取消訂單', async () => {
      const cancelledOrder = {
        id: 'order-1',
        status: OrderStatus.cancelled,
        cancelReason: '不想買了',
      };
      mockOrdersService.cancelOrder.mockResolvedValue(cancelledOrder);

      const result = await controller.cancelOrder(mockRequest, 'order-1', {
        reason: '不想買了',
      });

      expect(result).toEqual(cancelledOrder);
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'user-1',
        { reason: '不想買了' },
      );
    });

    it('應允許不提供取消原因', async () => {
      mockOrdersService.cancelOrder.mockResolvedValue({
        status: OrderStatus.cancelled,
      });

      await controller.cancelOrder(mockRequest, 'order-2', {});

      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        'order-2',
        'user-1',
        {},
      );
    });
  });
});

/**
 * AdminOrdersController 測試
 *
 * 測試管理員訂單管理 API 端點：
 * - 取得所有訂單
 * - 取得訂單統計
 * - 取得訂單詳情（管理員版）
 * - 更新訂單狀態
 */
describe('AdminOrdersController', () => {
  let controller: AdminOrdersController;

  // Mock OrdersService
  const mockOrdersService = {
    getAllOrders: jest.fn(),
    getOrderStats: jest.fn(),
    getOrderByIdForAdmin: jest.fn(),
    updateOrderStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<AdminOrdersController>(AdminOrdersController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 AdminOrdersController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getAllOrders 測試
  // ========================================

  describe('getAllOrders', () => {
    const ordersResult = {
      items: [
        { id: 'order-1', userId: 'user-1', status: OrderStatus.pending },
        { id: 'order-2', userId: 'user-2', status: OrderStatus.shipped },
      ],
      total: 100,
    };

    it('應回傳所有訂單列表', async () => {
      mockOrdersService.getAllOrders.mockResolvedValue(ordersResult);

      const result = await controller.getAllOrders(20, 0);

      expect(result).toEqual(ordersResult);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(
        20,
        0,
        undefined,
      );
    });

    it('應支援自訂分頁參數', async () => {
      mockOrdersService.getAllOrders.mockResolvedValue({ items: [], total: 0 });

      await controller.getAllOrders(100, 200);

      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(
        100,
        200,
        undefined,
      );
    });
  });

  // ========================================
  // getOrderStats 測試
  // ========================================

  describe('getOrderStats', () => {
    it('應回傳訂單統計', async () => {
      const stats = {
        totalOrders: 500,
        totalRevenue: 1500000,
        averageOrderValue: 3000,
        statusCounts: {
          [OrderStatus.pending]: 50,
          [OrderStatus.confirmed]: 100,
          [OrderStatus.shipped]: 200,
          [OrderStatus.delivered]: 150,
        },
      };
      mockOrdersService.getOrderStats.mockResolvedValue(stats);

      const result = await controller.getOrderStats();

      expect(result).toEqual(stats);
      expect(mockOrdersService.getOrderStats).toHaveBeenCalled();
    });
  });

  // ========================================
  // getOrderById 測試（管理員版）
  // ========================================

  describe('getOrderById', () => {
    it('應回傳訂單詳情（含使用者資訊）', async () => {
      const orderDetail = {
        id: 'order-1',
        status: OrderStatus.confirmed,
        totalAmount: 5000,
        user: { id: 'user-1', email: 'user@example.com', name: '測試用戶' },
        items: [{ productId: 'product-1', quantity: 2, price: 2500 }],
      };
      mockOrdersService.getOrderByIdForAdmin.mockResolvedValue(orderDetail);

      const result = await controller.getOrderById('order-1');

      expect(result).toEqual(orderDetail);
      expect(mockOrdersService.getOrderByIdForAdmin).toHaveBeenCalledWith(
        'order-1',
      );
    });
  });

  // ========================================
  // updateOrderStatus 測試
  // ========================================

  describe('updateOrderStatus', () => {
    it('應成功更新訂單狀態為已出貨', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: OrderStatus.shipped,
        trackingNumber: 'TRACK123456',
      };
      mockOrdersService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateOrderStatus('order-1', {
        status: OrderStatus.shipped,
        trackingNumber: 'TRACK123456',
      });

      expect(result).toEqual(updatedOrder);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        { status: OrderStatus.shipped, trackingNumber: 'TRACK123456' },
      );
    });

    it('應成功更新訂單狀態為已送達', async () => {
      mockOrdersService.updateOrderStatus.mockResolvedValue({
        status: OrderStatus.delivered,
      });

      await controller.updateOrderStatus('order-2', {
        status: OrderStatus.delivered,
      });

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-2',
        { status: OrderStatus.delivered },
      );
    });

    it('應成功將訂單標記為已付款', async () => {
      mockOrdersService.updateOrderStatus.mockResolvedValue({
        status: OrderStatus.confirmed,
      });

      await controller.updateOrderStatus('order-3', {
        status: OrderStatus.confirmed,
      });

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-3',
        { status: OrderStatus.confirmed },
      );
    });
  });
});

/**
 * AdminDashboardController 測試
 *
 * 測試儀表板統計 API 端點：
 * - 取得營收趨勢
 * - 取得訂單狀態分布
 * - 取得熱銷產品
 */
describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  // Mock OrdersService
  const mockOrdersService = {
    getRevenueTrend: jest.fn(),
    getOrderStatusDistribution: jest.fn(),
    getTopProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 AdminDashboardController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getRevenueTrend 測試
  // ========================================

  describe('getRevenueTrend', () => {
    const trendData = [
      { date: '2026-01-01', revenue: 50000, orderCount: 15 },
      { date: '2026-01-02', revenue: 75000, orderCount: 25 },
      { date: '2026-01-03', revenue: 60000, orderCount: 20 },
    ];

    it('應回傳日營收趨勢（預設）', async () => {
      mockOrdersService.getRevenueTrend.mockResolvedValue(trendData);

      const result = await controller.getRevenueTrend();

      expect(result).toEqual(trendData);
      expect(mockOrdersService.getRevenueTrend).toHaveBeenCalledWith('day');
    });

    it('應支援週營收趨勢', async () => {
      mockOrdersService.getRevenueTrend.mockResolvedValue(trendData);

      await controller.getRevenueTrend('week');

      expect(mockOrdersService.getRevenueTrend).toHaveBeenCalledWith('week');
    });

    it('應支援月營收趨勢', async () => {
      mockOrdersService.getRevenueTrend.mockResolvedValue(trendData);

      await controller.getRevenueTrend('month');

      expect(mockOrdersService.getRevenueTrend).toHaveBeenCalledWith('month');
    });
  });

  // ========================================
  // getOrderStatusDistribution 測試
  // ========================================

  describe('getOrderStatusDistribution', () => {
    it('應回傳訂單狀態分布', async () => {
      const distribution = [
        { status: OrderStatus.pending, count: 50, percentage: 10 },
        { status: OrderStatus.confirmed, count: 100, percentage: 20 },
        { status: OrderStatus.shipped, count: 150, percentage: 30 },
        { status: OrderStatus.delivered, count: 200, percentage: 40 },
      ];
      mockOrdersService.getOrderStatusDistribution.mockResolvedValue(
        distribution,
      );

      const result = await controller.getOrderStatusDistribution();

      expect(result).toEqual(distribution);
      expect(mockOrdersService.getOrderStatusDistribution).toHaveBeenCalled();
    });
  });

  // ========================================
  // getTopProducts 測試
  // ========================================

  describe('getTopProducts', () => {
    const topProducts = [
      { productId: 'product-1', name: '高山烏龍茶', soldCount: 500 },
      { productId: 'product-2', name: '東方美人茶', soldCount: 350 },
      { productId: 'product-3', name: '凍頂烏龍茶', soldCount: 280 },
    ];

    it('應回傳熱銷產品（預設 10 筆）', async () => {
      mockOrdersService.getTopProducts.mockResolvedValue(topProducts);

      const result = await controller.getTopProducts(10);

      expect(result).toEqual(topProducts);
      expect(mockOrdersService.getTopProducts).toHaveBeenCalledWith(10);
    });

    it('應支援自訂數量', async () => {
      mockOrdersService.getTopProducts.mockResolvedValue(
        topProducts.slice(0, 5),
      );

      await controller.getTopProducts(5);

      expect(mockOrdersService.getTopProducts).toHaveBeenCalledWith(5);
    });

    it('應支援取得更多產品', async () => {
      mockOrdersService.getTopProducts.mockResolvedValue([]);

      await controller.getTopProducts(50);

      expect(mockOrdersService.getTopProducts).toHaveBeenCalledWith(50);
    });
  });
});
