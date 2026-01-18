import { Test, TestingModule } from '@nestjs/testing';
import { MemberPointsService } from './member-points.service';
import { PrismaService } from '@/prisma/prisma.service';
import { MemberLevel } from '@prisma/client';

/**
 * MemberPointsService 測試
 *
 * 測試會員積分與等級升級的業務邏輯：
 * - 檢查並自動升級會員等級
 * - 消費獲得積分計算（含等級倍率和生日加成）
 * - 累積消費更新和升級檢查
 */
describe('MemberPointsService', () => {
  let service: MemberPointsService;

  // Mock Prisma
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    memberLevelConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    memberLevelHistory: {
      create: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callbacks) => {
      if (Array.isArray(callbacks)) {
        return Promise.all(callbacks);
      }
      return callbacks(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberPointsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MemberPointsService>(MemberPointsService);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 MemberPointsService', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // checkAndUpgradeLevel 測試
  // ========================================

  describe('checkAndUpgradeLevel', () => {
    const userId = 'user-123';
    const configs = [
      { level: MemberLevel.GOLD, minSpent: 30000 },
      { level: MemberLevel.SILVER, minSpent: 10000 },
      { level: MemberLevel.NORMAL, minSpent: 0 },
    ];

    it('使用者不存在應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
    });

    it('未達升級標準應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 5000, // 未達 SILVER 門檻
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('已是該等級應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000, // 達到 SILVER 但已是 SILVER
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('達到升級標準應升級並回傳 true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 15000, // 達到 SILVER 門檻
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('應跳級升級到符合資格的最高等級', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 50000, // 直接達到 GOLD 門檻
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(true);
      // 驗證升級到 GOLD
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberLevel: MemberLevel.GOLD,
          }),
        }),
      );
    });

    it('應記錄等級變更歷史', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      await service.checkAndUpgradeLevel(userId);

      expect(mockPrismaService.memberLevelHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          fromLevel: MemberLevel.NORMAL,
          toLevel: MemberLevel.SILVER,
          triggeredBy: 'system',
        }),
      });
    });
  });

  // ========================================
  // addPointsForPurchase 測試
  // ========================================

  describe('addPointsForPurchase', () => {
    const userId = 'user-123';
    const orderId = 'order-123';

    it('使用者不存在應回傳 0', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      expect(result).toBe(0);
    });

    it('等級設定不存在應回傳 0', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 0,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(null);

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      expect(result).toBe(0);
    });

    it('應計算基礎積分（1 元 = 1 點）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 0,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      expect(result).toBe(1000);
    });

    it('應套用等級倍率（1.5x）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        currentPoints: 500,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1.5,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      // 1000 * 1.5 = 1500
      expect(result).toBe(1500);
    });

    it('生日月應獲得雙倍積分', async () => {
      const today = new Date();
      const birthday = new Date(1990, today.getMonth(), 15); // 同月份

      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 0,
        birthday,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      // 1000 * 1 * 2 = 2000
      expect(result).toBe(2000);
    });

    it('生日月 + 等級倍率應疊加計算', async () => {
      const today = new Date();
      const birthday = new Date(1990, today.getMonth(), 15);

      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        currentPoints: 100,
        birthday,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1.5,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      // 1000 * 1.5 * 2 = 3000
      expect(result).toBe(3000);
    });

    it('非生日月不應獲得雙倍', async () => {
      const today = new Date();
      const differentMonth = (today.getMonth() + 6) % 12; // 半年後的月份
      const birthday = new Date(1990, differentMonth, 15);

      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 0,
        birthday,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      expect(result).toBe(1000);
    });

    it('應更新使用者積分餘額', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 500,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1,
      });

      await service.addPointsForPurchase(userId, 1000, orderId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { currentPoints: 1500 }, // 500 + 1000
      });
    });

    it('應建立積分交易記錄', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        currentPoints: 0,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1.5,
      });

      await service.addPointsForPurchase(userId, 1000, orderId);

      expect(mockPrismaService.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'PURCHASE',
          points: 1500,
          balance: 1500,
          orderId,
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('應取整數積分（無條件捨去）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        currentPoints: 0,
        birthday: null,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        pointMultiplier: 1.3,
      });

      const result = await service.addPointsForPurchase(userId, 1000, orderId);

      // 1000 * 1.3 = 1300
      expect(result).toBe(1300);
    });
  });

  // ========================================
  // updateTotalSpentAndCheckUpgrade 測試
  // ========================================

  describe('updateTotalSpentAndCheckUpgrade', () => {
    const userId = 'user-123';
    const configs = [
      { level: MemberLevel.GOLD, minSpent: 30000 },
      { level: MemberLevel.SILVER, minSpent: 10000 },
      { level: MemberLevel.NORMAL, minSpent: 0 },
    ];

    it('應更新累積消費並回傳新總額', async () => {
      mockPrismaService.user.update.mockResolvedValue({ totalSpent: 15000 });
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.updateTotalSpentAndCheckUpgrade(
        userId,
        5000,
      );

      expect(result.newTotalSpent).toBe(15000);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totalSpent: { increment: 5000 },
        },
        select: { totalSpent: true },
      });
    });

    it('達到升級門檻應回傳 upgraded: true', async () => {
      mockPrismaService.user.update.mockResolvedValue({ totalSpent: 15000 });
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.updateTotalSpentAndCheckUpgrade(
        userId,
        5000,
      );

      expect(result.upgraded).toBe(true);
    });

    it('未達升級門檻應回傳 upgraded: false', async () => {
      mockPrismaService.user.update.mockResolvedValue({ totalSpent: 8000 });
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 8000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(configs);

      const result = await service.updateTotalSpentAndCheckUpgrade(
        userId,
        3000,
      );

      expect(result.upgraded).toBe(false);
    });
  });
});
