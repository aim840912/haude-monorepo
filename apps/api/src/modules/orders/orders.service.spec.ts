import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';
import { EmailService } from '../email/email.service';
import { MembersService } from '../members/members.service';
import {
  createMockPrismaService,
  createMockEmailService,
  createMockDiscountsService,
  createMockMembersService,
  createMockUser,
  createMockProduct,
  createMockOrder,
  createMockCreateOrderDto,
} from '../../../test/utils/test-helpers';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;
  let mockEmailService: ReturnType<typeof createMockEmailService>;
  let mockDiscountsService: ReturnType<typeof createMockDiscountsService>;
  let mockMembersService: ReturnType<typeof createMockMembersService>;

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    mockEmailService = createMockEmailService();
    mockDiscountsService = createMockDiscountsService();
    mockMembersService = createMockMembersService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: DiscountsService, useValue: mockDiscountsService },
        { provide: MembersService, useValue: mockMembersService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('getUserOrders', () => {
    it('應回傳使用者的訂單列表與分頁資訊', async () => {
      const mockOrders = [createMockOrder(), createMockOrder({ id: 'order-2' })];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(2);

      const result = await service.getUserOrders('user-1', 20, 0);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          take: 20,
          skip: 0,
        }),
      );
    });

    it('應正確計算 hasMore 狀態', async () => {
      const mockOrders = Array(20).fill(createMockOrder());
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(50);

      const result = await service.getUserOrders('user-1', 20, 0);

      expect(result.hasMore).toBe(true);
    });
  });

  describe('getOrderById', () => {
    it('應回傳訂單詳情（含付款資訊）', async () => {
      const mockOrder = {
        ...createMockOrder(),
        payments: [{ id: 'payment-1', status: 'paid', paymentType: 'CREDIT' }],
      };
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1', 'user-1');

      expect(result.id).toBe('order-1');
      expect(result.payment).toBeDefined();
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1', userId: 'user-1' },
        }),
      );
    });

    it('訂單不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrderById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOrder', () => {
    const mockDto = createMockCreateOrderDto();
    const mockProduct = createMockProduct({ stock: 100, reservedStock: 0 });
    const mockUser = createMockUser();

    beforeEach(() => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockMembersService.getLevelConfig.mockResolvedValue({
        level: 'NORMAL',
        discountPercent: 0,
        freeShipping: false,
      });
      mockPrismaService.order.count.mockResolvedValue(0);

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          ...mockPrismaService,
          order: { ...mockPrismaService.order, create: jest.fn() },
          product: { ...mockPrismaService.product, updateMany: jest.fn() },
        };
        txMock.order.create.mockResolvedValue(createMockOrder());
        txMock.product.updateMany.mockResolvedValue({ count: 1 });
        return callback(txMock);
      });
    });

    it('應成功建立訂單', async () => {
      const result = await service.createOrder('user-1', mockDto);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBeDefined();
    });

    it('訂單項目為空時應拋出 BadRequestException', async () => {
      const emptyDto = { ...mockDto, items: [] };

      await expect(service.createOrder('user-1', emptyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('產品不存在時應拋出 BadRequestException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.createOrder('user-1', mockDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('庫存不足時應拋出 BadRequestException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct({ stock: 1, reservedStock: 0 }),
      );
      const bigOrderDto = {
        ...mockDto,
        items: [{ productId: 'product-1', quantity: 10 }],
      };

      await expect(service.createOrder('user-1', bigOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('折扣碼無效時應拋出 BadRequestException', async () => {
      mockDiscountsService.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '折扣碼已過期',
      });
      const dtoWithDiscount = { ...mockDto, discountCode: 'INVALID' };

      await expect(service.createOrder('user-1', dtoWithDiscount)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('金卡會員應享有免運費', async () => {
      mockMembersService.getLevelConfig.mockResolvedValue({
        level: 'GOLD',
        discountPercent: 10,
        freeShipping: true,
      });

      // 追蹤 transaction 內的 create 呼叫
      let capturedData: Record<string, unknown> | null = null;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          ...mockPrismaService,
          order: {
            create: jest.fn().mockImplementation((args) => {
              capturedData = args.data;
              return createMockOrder({ shippingFee: 0 });
            }),
          },
          product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        };
        return callback(txMock);
      });

      await service.createOrder('user-1', mockDto);

      expect(capturedData).not.toBeNull();
      expect((capturedData as Record<string, number>).shippingFee).toBe(0);
    });

    it('交易失敗時應回滾（庫存競態條件）', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          ...mockPrismaService,
          order: { create: jest.fn().mockResolvedValue(createMockOrder()) },
          product: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) }, // 庫存不足
        };
        return callback(txMock);
      });

      await expect(service.createOrder('user-1', mockDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelOrder', () => {
    const mockOrder = createMockOrder({ status: 'pending' });

    beforeEach(() => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...mockOrder,
        payments: [],
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          order: { update: jest.fn().mockResolvedValue({}) },
          product: { update: jest.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });
    });

    it('應成功取消待處理訂單並恢復庫存', async () => {
      const result = await service.cancelOrder('order-1', 'user-1', {
        reason: '不想要了',
      });

      expect(result.message).toBe('訂單已取消');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('已出貨訂單不可取消', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...createMockOrder({ status: 'shipped' }),
        payments: [],
      });

      await expect(
        service.cancelOrder('order-1', 'user-1', { reason: '取消' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('已送達訂單不可取消', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...createMockOrder({ status: 'delivered' }),
        payments: [],
      });

      await expect(
        service.cancelOrder('order-1', 'user-1', { reason: '取消' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrderStatus (admin)', () => {
    const mockOrder = {
      ...createMockOrder(),
      user: { email: 'test@example.com', name: '測試' },
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'shipped',
      });
    });

    it('應成功更新訂單狀態', async () => {
      const result = await service.updateOrderStatus('order-1', {
        status: 'shipped',
        trackingNumber: '1234567890',
      });

      expect(result.status).toBe('shipped');
      expect(mockPrismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({
            status: 'shipped',
            trackingNumber: '1234567890',
          }),
        }),
      );
    });

    it('出貨時應發送通知郵件', async () => {
      await service.updateOrderStatus('order-1', {
        status: 'shipped',
        trackingNumber: '1234567890',
      });

      // 等待非同步郵件發送
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEmailService.sendShippingNotificationEmail).toHaveBeenCalled();
    });

    it('訂單不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('non-existent', { status: 'shipped' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('訂單送達時應更新會員積分', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'shipped',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'delivered',
      });

      await service.updateOrderStatus('order-1', { status: 'delivered' });

      // 等待非同步處理
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockMembersService.updateTotalSpentAndCheckUpgrade).toHaveBeenCalled();
      expect(mockMembersService.addPointsForPurchase).toHaveBeenCalled();
    });
  });

  describe('getOrderStats (admin)', () => {
    it('應回傳訂單統計資料', async () => {
      mockPrismaService.order.count.mockResolvedValue(100);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1000000 },
      });
      mockPrismaService.order.groupBy.mockResolvedValue([
        { status: 'pending', _count: { status: 10 } },
        { status: 'confirmed', _count: { status: 20 } },
        { status: 'shipped', _count: { status: 30 } },
        { status: 'delivered', _count: { status: 35 } },
        { status: 'cancelled', _count: { status: 5 } },
      ]);

      const result = await service.getOrderStats();

      expect(result.totalOrders).toBe(100);
      expect(result.totalAmount).toBe(1000000);
      expect(result.pendingOrders).toBe(10);
      expect(result.cancelledOrders).toBe(5);
    });
  });

  describe('getRevenueTrend', () => {
    it('應回傳按日期分組的營收趨勢', async () => {
      const mockOrders = [
        { createdAt: new Date('2024-01-15'), totalAmount: 1000 },
        { createdAt: new Date('2024-01-15'), totalAmount: 500 },
        { createdAt: new Date('2024-01-14'), totalAmount: 800 },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getRevenueTrend('day');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
