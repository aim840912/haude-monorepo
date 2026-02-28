import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  QueryUserOrdersService,
  QueryAdminOrdersService,
  OrderStatsService,
  DashboardAnalyticsService,
  CreateOrderService,
  CancelOrderService,
  UpdateOrderService,
  OrderExpiryService,
} from './services';
import {
  createMockOrder,
  createMockCreateOrderDto,
} from '../../../test/utils/test-helpers';

/**
 * OrdersService Facade 測試
 *
 * OrdersService 是一個 Facade，將操作委派給專責服務。
 * 這些測試驗證：
 * 1. 委派是否正確傳遞參數
 * 2. 委派是否正確返回結果
 * 3. 錯誤是否正確傳播
 */
describe('OrdersService (Facade)', () => {
  let service: OrdersService;
  let mockQueryUserOrdersService: jest.Mocked<QueryUserOrdersService>;
  let mockQueryAdminOrdersService: jest.Mocked<QueryAdminOrdersService>;
  let mockOrderStatsService: jest.Mocked<OrderStatsService>;
  let mockDashboardAnalyticsService: jest.Mocked<DashboardAnalyticsService>;
  let mockCreateOrderService: jest.Mocked<CreateOrderService>;
  let mockCancelOrderService: jest.Mocked<CancelOrderService>;
  let mockUpdateOrderService: jest.Mocked<UpdateOrderService>;
  let mockOrderExpiryService: jest.Mocked<OrderExpiryService>;

  beforeEach(async () => {
    // 建立 mock 專責服務
    mockQueryUserOrdersService = {
      getUserOrders: jest.fn(),
      getOrderById: jest.fn(),
    } as unknown as jest.Mocked<QueryUserOrdersService>;

    mockQueryAdminOrdersService = {
      getAllOrders: jest.fn(),
      getOrderByIdForAdmin: jest.fn(),
    } as unknown as jest.Mocked<QueryAdminOrdersService>;

    mockOrderStatsService = {
      getOrderStats: jest.fn(),
    } as unknown as jest.Mocked<OrderStatsService>;

    mockDashboardAnalyticsService = {
      getRevenueTrend: jest.fn(),
      getOrderStatusDistribution: jest.fn(),
      getTopProducts: jest.fn(),
    } as unknown as jest.Mocked<DashboardAnalyticsService>;

    mockCreateOrderService = {
      createOrder: jest.fn(),
    } as unknown as jest.Mocked<CreateOrderService>;

    mockCancelOrderService = {
      cancelOrder: jest.fn(),
    } as unknown as jest.Mocked<CancelOrderService>;

    mockUpdateOrderService = {
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<UpdateOrderService>;

    mockOrderExpiryService = {
      handleExpiredOrders: jest.fn(),
    } as unknown as jest.Mocked<OrderExpiryService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: QueryUserOrdersService,
          useValue: mockQueryUserOrdersService,
        },
        {
          provide: QueryAdminOrdersService,
          useValue: mockQueryAdminOrdersService,
        },
        { provide: OrderStatsService, useValue: mockOrderStatsService },
        {
          provide: DashboardAnalyticsService,
          useValue: mockDashboardAnalyticsService,
        },
        { provide: CreateOrderService, useValue: mockCreateOrderService },
        { provide: CancelOrderService, useValue: mockCancelOrderService },
        { provide: UpdateOrderService, useValue: mockUpdateOrderService },
        { provide: OrderExpiryService, useValue: mockOrderExpiryService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  // ========================================
  // 使用者查詢方法
  // ========================================

  describe('getUserOrders', () => {
    it('應委派給 QueryUserOrdersService.getUserOrders', async () => {
      const mockOrders = [
        createMockOrder(),
        createMockOrder({ id: 'order-2' }),
      ];
      const mockResult = {
        orders: mockOrders,
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };
      mockQueryUserOrdersService.getUserOrders.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.getUserOrders('user-1', 20, 0);

      expect(mockQueryUserOrdersService.getUserOrders).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
      expect(result).toEqual(mockResult);
    });

    it('應正確傳遞預設參數', async () => {
      mockQueryUserOrdersService.getUserOrders.mockResolvedValue({
        orders: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      });

      await service.getUserOrders('user-1');

      expect(mockQueryUserOrdersService.getUserOrders).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
    });
  });

  describe('getOrderById', () => {
    it('應委派給 QueryUserOrdersService.getOrderById', async () => {
      const mockOrder = {
        ...createMockOrder(),
        payment: { id: 'payment-1', status: 'paid' },
      };
      mockQueryUserOrdersService.getOrderById.mockResolvedValue(
        mockOrder as any,
      );

      const result = await service.getOrderById('order-1', 'user-1');

      expect(mockQueryUserOrdersService.getOrderById).toHaveBeenCalledWith(
        'order-1',
        'user-1',
      );
      expect(result).toEqual(mockOrder);
    });

    it('訂單不存在時應傳播 NotFoundException', async () => {
      mockQueryUserOrdersService.getOrderById.mockRejectedValue(
        new NotFoundException('訂單不存在或無權限查看'),
      );

      await expect(
        service.getOrderById('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // 管理員查詢方法
  // ========================================

  describe('getAllOrders', () => {
    it('應委派給 QueryAdminOrdersService.getAllOrders', async () => {
      const mockResult = {
        orders: [createMockOrder()],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };
      mockQueryAdminOrdersService.getAllOrders.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.getAllOrders(20, 0);

      expect(mockQueryAdminOrdersService.getAllOrders).toHaveBeenCalledWith(
        20,
        0,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getOrderByIdForAdmin', () => {
    it('應委派給 QueryAdminOrdersService.getOrderByIdForAdmin', async () => {
      const mockOrder = createMockOrder();
      mockQueryAdminOrdersService.getOrderByIdForAdmin.mockResolvedValue(
        mockOrder as any,
      );

      const result = await service.getOrderByIdForAdmin('order-1');

      expect(
        mockQueryAdminOrdersService.getOrderByIdForAdmin,
      ).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockOrder);
    });
  });

  // ========================================
  // 訂單統計
  // ========================================

  describe('getOrderStats', () => {
    it('應委派給 OrderStatsService.getOrderStats', async () => {
      const mockStats = {
        totalOrders: 100,
        totalAmount: 1000000,
        pendingOrders: 10,
        confirmedOrders: 20,
        processingOrders: 15,
        shippedOrders: 30,
        deliveredOrders: 20,
        cancelledOrders: 5,
      };
      mockOrderStatsService.getOrderStats.mockResolvedValue(mockStats);

      const result = await service.getOrderStats();

      expect(mockOrderStatsService.getOrderStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  // ========================================
  // 儀表板分析
  // ========================================

  describe('getRevenueTrend', () => {
    it('應委派給 DashboardAnalyticsService.getRevenueTrend', async () => {
      const mockTrend = [
        { date: '2024-01-15', revenue: 1500, orders: 2 },
        { date: '2024-01-14', revenue: 800, orders: 1 },
      ];
      mockDashboardAnalyticsService.getRevenueTrend.mockResolvedValue(
        mockTrend,
      );

      const result = await service.getRevenueTrend('day');

      expect(
        mockDashboardAnalyticsService.getRevenueTrend,
      ).toHaveBeenCalledWith('day');
      expect(result).toEqual(mockTrend);
    });
  });

  describe('getOrderStatusDistribution', () => {
    it('應委派給 DashboardAnalyticsService.getOrderStatusDistribution', async () => {
      const mockDistribution = [
        { status: 'pending', count: 10, label: '待處理' },
        { status: 'shipped', count: 30, label: '已出貨' },
      ];
      mockDashboardAnalyticsService.getOrderStatusDistribution.mockResolvedValue(
        mockDistribution as any,
      );

      const result = await service.getOrderStatusDistribution();

      expect(
        mockDashboardAnalyticsService.getOrderStatusDistribution,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockDistribution);
    });
  });

  describe('getTopProducts', () => {
    it('應委派給 DashboardAnalyticsService.getTopProducts', async () => {
      const mockProducts = [
        { id: 'product-1', name: '高山茶', sales: 100, revenue: 50000 },
      ];
      mockDashboardAnalyticsService.getTopProducts.mockResolvedValue(
        mockProducts,
      );

      const result = await service.getTopProducts(10);

      expect(mockDashboardAnalyticsService.getTopProducts).toHaveBeenCalledWith(
        10,
      );
      expect(result).toEqual(mockProducts);
    });
  });

  // ========================================
  // 建立訂單
  // ========================================

  describe('createOrder', () => {
    it('應委派給 CreateOrderService.createOrder', async () => {
      const mockDto = createMockCreateOrderDto();
      const mockOrder = createMockOrder();
      mockCreateOrderService.createOrder.mockResolvedValue(mockOrder as any);

      const result = await service.createOrder('user-1', mockDto);

      expect(mockCreateOrderService.createOrder).toHaveBeenCalledWith(
        'user-1',
        mockDto,
      );
      expect(result).toEqual(mockOrder);
    });

    it('訂單項目為空時應傳播 BadRequestException', async () => {
      const emptyDto = { ...createMockCreateOrderDto(), items: [] };
      mockCreateOrderService.createOrder.mockRejectedValue(
        new BadRequestException('訂單至少需要一個商品'),
      );

      await expect(service.createOrder('user-1', emptyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('庫存不足時應傳播 BadRequestException', async () => {
      const mockDto = createMockCreateOrderDto();
      mockCreateOrderService.createOrder.mockRejectedValue(
        new BadRequestException('產品庫存不足'),
      );

      await expect(service.createOrder('user-1', mockDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ========================================
  // 取消訂單
  // ========================================

  describe('cancelOrder', () => {
    it('應委派給 CancelOrderService.cancelOrder', async () => {
      const mockResult = { message: '訂單已取消' };
      mockCancelOrderService.cancelOrder.mockResolvedValue(mockResult);

      const result = await service.cancelOrder('order-1', 'user-1', {
        reason: '不想要了',
      });

      expect(mockCancelOrderService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'user-1',
        { reason: '不想要了' },
      );
      expect(result).toEqual(mockResult);
    });

    it('已出貨訂單不可取消時應傳播 BadRequestException', async () => {
      mockCancelOrderService.cancelOrder.mockRejectedValue(
        new BadRequestException('此訂單狀態無法取消'),
      );

      await expect(
        service.cancelOrder('order-1', 'user-1', { reason: '取消' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ========================================
  // 更新訂單狀態
  // ========================================

  describe('updateOrderStatus', () => {
    it('應委派給 UpdateOrderService.updateOrderStatus', async () => {
      const mockOrder = { ...createMockOrder(), status: 'shipped' };
      mockUpdateOrderService.updateOrderStatus.mockResolvedValue(
        mockOrder as any,
      );

      const result = await service.updateOrderStatus('order-1', {
        status: 'shipped',
        trackingNumber: '1234567890',
      });

      expect(mockUpdateOrderService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        { status: 'shipped', trackingNumber: '1234567890' },
      );
      expect(result).toEqual(mockOrder);
    });

    it('訂單不存在時應傳播 NotFoundException', async () => {
      mockUpdateOrderService.updateOrderStatus.mockRejectedValue(
        new NotFoundException('訂單不存在'),
      );

      await expect(
        service.updateOrderStatus('non-existent', { status: 'shipped' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
