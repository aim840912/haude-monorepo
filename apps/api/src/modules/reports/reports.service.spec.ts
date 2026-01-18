import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  // Mock Prisma
  const mockPrismaService = {
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  // ========================================
  // 銷售摘要測試
  // ========================================

  describe('getSalesSummary', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('應回傳當期銷售摘要', async () => {
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
        _count: { id: 20 },
      });
      mockPrismaService.order.count.mockResolvedValue(2); // 取消訂單

      const result = await service.getSalesSummary(startDate, endDate);

      expect(result.current).toEqual({
        totalRevenue: 50000,
        totalOrders: 20,
        averageOrderValue: 2500, // 50000 / 20
        cancelRate: expect.any(Number),
      });
      expect(result.period.start).toBe('2024-01-01');
      expect(result.period.end).toBe('2024-01-31');
    });

    it('無訂單時應回傳零值', async () => {
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: { id: 0 },
      });
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.getSalesSummary(startDate, endDate);

      expect(result.current.totalRevenue).toBe(0);
      expect(result.current.totalOrders).toBe(0);
      expect(result.current.averageOrderValue).toBe(0);
      expect(result.current.cancelRate).toBe(0);
    });

    it('應正確計算取消率', async () => {
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: { id: 8 }, // 8 筆正常訂單
      });
      mockPrismaService.order.count.mockResolvedValue(2); // 2 筆取消

      const result = await service.getSalesSummary(startDate, endDate);

      // 取消率 = 2 / (8 + 2) * 100 = 20%
      expect(result.current.cancelRate).toBe(20);
    });

    describe('年同比 (YoY)', () => {
      it('應計算年同比變化', async () => {
        // 當期
        mockPrismaService.order.aggregate
          .mockResolvedValueOnce({
            _sum: { totalAmount: 100000 },
            _count: { id: 50 },
          })
          // 去年同期
          .mockResolvedValueOnce({
            _sum: { totalAmount: 80000 },
            _count: { id: 40 },
          });
        mockPrismaService.order.count
          .mockResolvedValueOnce(5) // 當期取消
          .mockResolvedValueOnce(4); // 去年取消

        const result = await service.getSalesSummary(startDate, endDate, 'yoy');

        expect(result.compare).not.toBeNull();
        expect(result.changes).not.toBeNull();
        expect(result.changes?.revenueChange).toBe(25); // (100000-80000)/80000*100
      });
    });

    describe('月環比 (MoM)', () => {
      it('應計算月環比變化', async () => {
        mockPrismaService.order.aggregate
          .mockResolvedValueOnce({
            _sum: { totalAmount: 50000 },
            _count: { id: 25 },
          })
          .mockResolvedValueOnce({
            _sum: { totalAmount: 50000 },
            _count: { id: 25 },
          });
        mockPrismaService.order.count.mockResolvedValue(0);

        const result = await service.getSalesSummary(startDate, endDate, 'mom');

        expect(result.compare).not.toBeNull();
        expect(result.changes?.revenueChange).toBe(0); // 相同，無變化
      });
    });

    describe('週環比 (WoW)', () => {
      it('應計算週環比變化', async () => {
        mockPrismaService.order.aggregate
          .mockResolvedValueOnce({
            _sum: { totalAmount: 30000 },
            _count: { id: 15 },
          })
          .mockResolvedValueOnce({
            _sum: { totalAmount: 20000 },
            _count: { id: 10 },
          });
        mockPrismaService.order.count.mockResolvedValue(0);

        const result = await service.getSalesSummary(startDate, endDate, 'wow');

        expect(result.compare).not.toBeNull();
        expect(result.changes?.revenueChange).toBe(50); // (30000-20000)/20000*100
      });
    });

    it('對比期營收為零時變化應為 100%', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({
          _sum: { totalAmount: 10000 },
          _count: { id: 5 },
        })
        .mockResolvedValueOnce({
          _sum: { totalAmount: 0 },
          _count: { id: 0 },
        });
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.getSalesSummary(startDate, endDate, 'yoy');

      expect(result.changes?.revenueChange).toBe(100);
    });
  });

  // ========================================
  // 銷售趨勢測試
  // ========================================

  describe('getSalesTrend', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-07');

    it('應回傳按日分組的趨勢', async () => {
      const mockOrders = [
        { createdAt: new Date('2024-01-01'), totalAmount: 1000 },
        { createdAt: new Date('2024-01-01'), totalAmount: 2000 },
        { createdAt: new Date('2024-01-02'), totalAmount: 1500 },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesTrend(startDate, endDate, 'day');

      expect(result).toHaveLength(2); // 2 個不同日期
      const jan1 = result.find((r) => r.date === '2024-01-01');
      expect(jan1?.revenue).toBe(3000); // 1000 + 2000
      expect(jan1?.orders).toBe(2);
      expect(jan1?.averageOrderValue).toBe(1500); // 3000 / 2
    });

    it('應回傳按週分組的趨勢', async () => {
      const mockOrders = [
        { createdAt: new Date('2024-01-01'), totalAmount: 1000 }, // 週一
        { createdAt: new Date('2024-01-03'), totalAmount: 2000 }, // 週三，同一週
        { createdAt: new Date('2024-01-08'), totalAmount: 1500 }, // 下週
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesTrend(startDate, endDate, 'week');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('應回傳按月分組的趨勢', async () => {
      const mockOrders = [
        { createdAt: new Date('2024-01-15'), totalAmount: 5000 },
        { createdAt: new Date('2024-01-20'), totalAmount: 3000 },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesTrend(startDate, endDate, 'month');

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-01'); // 月份開始日
      expect(result[0].revenue).toBe(8000);
    });

    it('無訂單時應回傳空陣列', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getSalesTrend(startDate, endDate, 'day');

      expect(result).toEqual([]);
    });

    it('應按日期排序', async () => {
      const mockOrders = [
        { createdAt: new Date('2024-01-03'), totalAmount: 1000 },
        { createdAt: new Date('2024-01-01'), totalAmount: 2000 },
        { createdAt: new Date('2024-01-02'), totalAmount: 1500 },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesTrend(startDate, endDate, 'day');

      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-02');
      expect(result[2].date).toBe('2024-01-03');
    });
  });

  // ========================================
  // 銷售明細測試
  // ========================================

  describe('getSalesDetail', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const mockOrders = [
      {
        createdAt: new Date('2024-01-15'),
        orderNumber: 'ORD-001',
        user: { name: '王小明' },
        items: [{ id: 'item-1' }, { id: 'item-2' }],
        subtotal: 1000,
        discountAmount: 100,
        shippingFee: 60,
        totalAmount: 960,
        status: 'completed',
        paymentStatus: 'paid',
      },
    ];

    it('應回傳銷售明細列表', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getSalesDetail(startDate, endDate);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        date: '2024-01-15',
        orderNumber: 'ORD-001',
        customerName: '王小明',
        productCount: 2,
        subtotal: 1000,
        discount: 100,
        shipping: 60,
        total: 960,
        status: 'completed',
        paymentStatus: 'paid',
      });
    });

    it('應支援分頁', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(50);

      const result = await service.getSalesDetail(startDate, endDate, 20, 0);

      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true); // 0 + 1 < 50
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });

    it('最後一頁 hasMore 應為 false', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getSalesDetail(startDate, endDate, 20, 0);

      expect(result.hasMore).toBe(false);
    });

    it('訪客訂單應顯示「訪客」', async () => {
      const guestOrder = {
        ...mockOrders[0],
        user: null,
      };
      mockPrismaService.order.findMany.mockResolvedValue([guestOrder]);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getSalesDetail(startDate, endDate);

      expect(result.items[0].customerName).toBe('訪客');
    });

    it('應按建立時間倒序排列', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getSalesDetail(startDate, endDate);

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});
