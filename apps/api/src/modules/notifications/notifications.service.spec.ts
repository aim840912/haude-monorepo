import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;

  // Mock Prisma
  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    stockAlertSetting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  // ========================================
  // 通知查詢方法測試
  // ========================================

  describe('findAllForAdmin', () => {
    it('應回傳系統通知列表和總數', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: '新訂單', userId: null },
        { id: 'notif-2', title: '庫存警報', userId: null },
      ];
      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );
      mockPrismaService.notification.count.mockResolvedValue(2);

      const result = await service.findAllForAdmin();

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.total).toBe(2);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('應支援分頁', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(100);

      await service.findAllForAdmin({ limit: 10, offset: 20 });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });

    it('應支援只查詢未讀', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(5);

      await service.findAllForAdmin({ unreadOnly: true });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: null, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('應回傳未讀通知數量', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount();

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: null, isRead: false },
      });
    });
  });

  describe('findOne', () => {
    it('應回傳單一通知', async () => {
      const mockNotification = { id: 'notif-1', title: '測試通知' };
      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );

      const result = await service.findOne('notif-1');

      expect(result).toEqual(mockNotification);
    });
  });

  // ========================================
  // 通知操作方法測試
  // ========================================

  describe('create', () => {
    const createDto = {
      type: NotificationType.NEW_ORDER,
      title: '新訂單通知',
      message: '收到新訂單 #001',
    };

    it('應成功建立通知', async () => {
      const mockNotification = { id: 'notif-new', ...createDto };
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
          title: createDto.title,
          message: createDto.message,
          data: undefined,
          userId: undefined,
        },
      });
    });

    it('應可包含額外資料', async () => {
      const dtoWithData = {
        ...createDto,
        data: { orderId: 'order-123' },
      };
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
        ...dtoWithData,
      });

      await service.create(dtoWithData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: { orderId: 'order-123' },
        }),
      });
    });
  });

  describe('markAsRead', () => {
    it('應標記通知為已讀', async () => {
      mockPrismaService.notification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
        readAt: expect.any(Date),
      });

      const result = await service.markAsRead('notif-1');

      expect(result.isRead).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('應標記所有系統通知為已讀', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({
        count: 10,
      });

      const result = await service.markAllAsRead();

      expect(result.count).toBe(10);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: null, isRead: false },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('delete', () => {
    it('應刪除通知', async () => {
      mockPrismaService.notification.delete.mockResolvedValue({
        id: 'notif-1',
      });

      const result = await service.delete('notif-1');

      expect(result).toHaveProperty('id', 'notif-1');
    });
  });

  // ========================================
  // 通知建立輔助方法測試
  // ========================================

  describe('createNewOrderNotification', () => {
    const orderData = {
      id: 'order-123',
      orderNumber: 'ORD-001',
      totalAmount: 1500,
      userName: '王小明',
    };

    it('應建立新訂單通知', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
        type: NotificationType.NEW_ORDER,
        title: '新訂單通知',
      });

      const result = await service.createNewOrderNotification(orderData);

      expect(result.type).toBe(NotificationType.NEW_ORDER);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.NEW_ORDER,
          title: '新訂單通知',
          message: expect.stringContaining('王小明'),
          data: expect.objectContaining({
            orderId: 'order-123',
            orderNumber: 'ORD-001',
          }),
        }),
      });
    });
  });

  describe('createOrderCancelledNotification', () => {
    it('應建立訂單取消通知（含原因）', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
        type: NotificationType.ORDER_CANCELLED,
      });

      await service.createOrderCancelledNotification({
        id: 'order-123',
        orderNumber: 'ORD-001',
        reason: '庫存不足',
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.ORDER_CANCELLED,
          message: expect.stringContaining('庫存不足'),
        }),
      });
    });

    it('應建立訂單取消通知（無原因）', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
      });

      await service.createOrderCancelledNotification({
        id: 'order-123',
        orderNumber: 'ORD-001',
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.ORDER_CANCELLED,
          title: '訂單已取消',
        }),
      });
    });
  });

  describe('createPaymentSuccessNotification', () => {
    it('應建立付款成功通知', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
        type: NotificationType.PAYMENT_SUCCESS,
      });

      await service.createPaymentSuccessNotification({
        id: 'order-123',
        orderNumber: 'ORD-001',
        totalAmount: 2000,
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.PAYMENT_SUCCESS,
          title: '付款成功',
        }),
      });
    });
  });

  describe('createLowStockNotification', () => {
    it('應建立庫存預警通知', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-new',
        type: NotificationType.LOW_STOCK,
      });

      await service.createLowStockNotification({
        id: 'product-123',
        name: '高山烏龍茶',
        stock: 5,
        threshold: 10,
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.LOW_STOCK,
          title: '庫存預警',
          message: expect.stringContaining('高山烏龍茶'),
        }),
      });
    });
  });

  // ========================================
  // 庫存預警設定測試
  // ========================================

  describe('getStockAlertSettings', () => {
    it('應回傳所有庫存預警設定', async () => {
      const mockSettings = [
        { productId: 'p-1', threshold: 10, product: { name: '茶葉A' } },
        { productId: 'p-2', threshold: 5, product: { name: '茶葉B' } },
      ];
      mockPrismaService.stockAlertSetting.findMany.mockResolvedValue(
        mockSettings,
      );

      const result = await service.getStockAlertSettings();

      expect(result).toEqual(mockSettings);
    });
  });

  describe('upsertStockAlertSetting', () => {
    it('應建立或更新庫存預警設定', async () => {
      mockPrismaService.stockAlertSetting.upsert.mockResolvedValue({
        productId: 'product-123',
        threshold: 15,
        isEnabled: true,
      });

      const result = await service.upsertStockAlertSetting('product-123', {
        threshold: 15,
      });

      expect(result.threshold).toBe(15);
      expect(mockPrismaService.stockAlertSetting.upsert).toHaveBeenCalledWith({
        where: { productId: 'product-123' },
        create: expect.objectContaining({
          productId: 'product-123',
          threshold: 15,
        }),
        update: expect.objectContaining({
          threshold: 15,
        }),
      });
    });
  });

  describe('checkAndCreateStockAlert', () => {
    it('產品不存在應回傳 null', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toBeNull();
    });

    it('無設定應回傳 null', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-123',
        stock: 5,
        stockAlertSetting: null,
      });

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toBeNull();
    });

    it('設定已停用應回傳 null', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-123',
        stock: 5,
        stockAlertSetting: { threshold: 10, isEnabled: false },
      });

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toBeNull();
    });

    it('庫存高於警戒線應回傳 null', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-123',
        stock: 15,
        stockAlertSetting: { threshold: 10, isEnabled: true },
      });

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toBeNull();
    });

    it('24小時內已有警報應回傳 null', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-123',
        name: '茶葉',
        stock: 5,
        stockAlertSetting: { threshold: 10, isEnabled: true },
      });
      mockPrismaService.notification.findFirst.mockResolvedValue({
        id: 'recent-alert',
      });

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toBeNull();
    });

    it('應建立庫存預警', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-123',
        name: '茶葉',
        stock: 5,
        stockAlertSetting: { threshold: 10, isEnabled: true },
      });
      mockPrismaService.notification.findFirst.mockResolvedValue(null);
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'new-alert',
        type: NotificationType.LOW_STOCK,
      });

      const result = await service.checkAndCreateStockAlert('product-123');

      expect(result).toHaveProperty('type', NotificationType.LOW_STOCK);
    });
  });
});
