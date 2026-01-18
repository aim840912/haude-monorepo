import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MemberLevel } from '@prisma/client';

describe('MembersService', () => {
  let service: MembersService;

  // Mock Prisma
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    memberLevelConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    memberLevelHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    pointTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callbacks) => {
      if (typeof callbacks === 'function') {
        return callbacks(mockPrismaService);
      }
      return Promise.all(callbacks);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);

    jest.clearAllMocks();
  });

  // ========================================
  // 會員等級資訊測試
  // ========================================

  describe('getLevelInfo', () => {
    const userId = 'user-123';

    it('應回傳會員等級資訊', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 5000,
        currentPoints: 500,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        level: MemberLevel.NORMAL,
        displayName: '普通會員',
        discountPercent: 0,
        freeShipping: false,
        pointMultiplier: 1,
      });

      const result = await service.getLevelInfo(userId);

      expect(result).toEqual({
        level: MemberLevel.NORMAL,
        displayName: '普通會員',
        totalSpent: 5000,
        currentPoints: 500,
        discountPercent: 0,
        freeShipping: false,
        pointMultiplier: 1,
      });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getLevelInfo(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('等級設定不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(null);

      await expect(service.getLevelInfo(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUpgradeProgress', () => {
    const userId = 'user-123';

    it('應回傳升級進度資訊', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 8000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.NORMAL, displayName: '普通會員', minSpent: 0 },
        { level: MemberLevel.SILVER, displayName: '銀卡會員', minSpent: 10000 },
        { level: MemberLevel.GOLD, displayName: '金卡會員', minSpent: 30000 },
      ]);

      const result = await service.getUpgradeProgress(userId);

      expect(result.currentLevel).toBe(MemberLevel.NORMAL);
      expect(result.nextLevel).toBe(MemberLevel.SILVER);
      expect(result.amountToNextLevel).toBe(2000);
      expect(result.progressPercent).toBe(80); // 8000/10000 = 80%
    });

    it('最高等級應回傳 100% 進度', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.GOLD,
        totalSpent: 50000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.NORMAL, displayName: '普通會員', minSpent: 0 },
        { level: MemberLevel.GOLD, displayName: '金卡會員', minSpent: 30000 },
      ]);

      const result = await service.getUpgradeProgress(userId);

      expect(result.nextLevel).toBeNull();
      expect(result.progressPercent).toBe(100);
    });
  });

  describe('getPointsBalance', () => {
    it('應回傳積分餘額', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 1500,
      });

      const result = await service.getPointsBalance('user-123');

      expect(result).toEqual({ balance: 1500 });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getPointsBalance('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPointsHistory', () => {
    const userId = 'user-123';

    it('應回傳積分歷史', async () => {
      const mockItems = [
        {
          id: 'trans-1',
          type: 'PURCHASE',
          points: 100,
          balance: 600,
          description: '消費獲得',
          createdAt: new Date(),
        },
      ];
      mockPrismaService.pointTransaction.findMany.mockResolvedValue(mockItems);
      mockPrismaService.pointTransaction.count.mockResolvedValue(1);

      const result = await service.getPointsHistory(userId);

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('應支援分頁', async () => {
      mockPrismaService.pointTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.pointTransaction.count.mockResolvedValue(100);

      const result = await service.getPointsHistory(userId, 10, 0);

      expect(result.hasMore).toBe(true);
    });
  });

  // ========================================
  // 等級升級測試
  // ========================================

  describe('checkAndUpgradeLevel', () => {
    const userId = 'user-123';

    it('使用者不存在應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
    });

    it('未達升級標準應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 5000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.SILVER, minSpent: 10000 },
        { level: MemberLevel.NORMAL, minSpent: 0 },
      ]);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
    });

    it('已是該等級應回傳 false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.GOLD, minSpent: 30000 },
        { level: MemberLevel.SILVER, minSpent: 10000 },
        { level: MemberLevel.NORMAL, minSpent: 0 },
      ]);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(false);
    });

    it('達到升級標準應升級並回傳 true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.GOLD, minSpent: 30000 },
        { level: MemberLevel.SILVER, minSpent: 10000 },
        { level: MemberLevel.NORMAL, minSpent: 0 },
      ]);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

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

    it('應計算並回傳獲得的積分', async () => {
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
  });

  describe('updateTotalSpentAndCheckUpgrade', () => {
    const userId = 'user-123';

    it('應更新消費並檢查升級', async () => {
      mockPrismaService.user.update.mockResolvedValue({ totalSpent: 15000 });
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([
        { level: MemberLevel.SILVER, minSpent: 10000 },
        { level: MemberLevel.NORMAL, minSpent: 0 },
      ]);

      const result = await service.updateTotalSpentAndCheckUpgrade(
        userId,
        5000,
      );

      expect(result.newTotalSpent).toBe(15000);
      expect(result.upgraded).toBe(true);
    });
  });

  // ========================================
  // 等級設定測試
  // ========================================

  describe('getLevelConfig', () => {
    it('應回傳等級設定', async () => {
      const mockConfig = {
        level: MemberLevel.SILVER,
        displayName: '銀卡會員',
        discountPercent: 5,
      };
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(
        mockConfig,
      );

      const result = await service.getLevelConfig(MemberLevel.SILVER);

      expect(result).toEqual(mockConfig);
    });
  });

  describe('getAllLevelConfigs', () => {
    it('應回傳所有等級設定', async () => {
      const mockConfigs = [
        { level: MemberLevel.NORMAL, minSpent: 0 },
        { level: MemberLevel.SILVER, minSpent: 10000 },
      ];
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(
        mockConfigs,
      );

      const result = await service.getAllLevelConfigs();

      expect(result).toEqual(mockConfigs);
    });
  });

  // ========================================
  // Admin 方法測試
  // ========================================

  describe('getAdminMembersList', () => {
    it('應回傳會員列表', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'a@test.com', memberLevel: MemberLevel.NORMAL },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.getAdminMembersList({});

      expect(result.items).toEqual(mockUsers);
      expect(result.total).toBe(1);
    });

    it('應支援等級篩選', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getAdminMembersList({ level: MemberLevel.SILVER });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberLevel: MemberLevel.SILVER,
          }),
        }),
      );
    });

    it('應支援搜尋', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getAdminMembersList({ search: '王小明' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getMemberLevelHistory', () => {
    const userId = 'user-123';

    it('應回傳等級變更歷史', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      const mockHistory = [
        {
          id: 'hist-1',
          fromLevel: MemberLevel.NORMAL,
          toLevel: MemberLevel.SILVER,
          reason: '消費升級',
          createdAt: new Date(),
        },
      ];
      mockPrismaService.memberLevelHistory.findMany.mockResolvedValue(
        mockHistory,
      );
      mockPrismaService.memberLevelHistory.count.mockResolvedValue(1);

      const result = await service.getMemberLevelHistory(userId);

      expect(result.items).toEqual(mockHistory);
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMemberLevelHistory(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustMemberLevel', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';

    it('應調整會員等級', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        memberLevel: MemberLevel.SILVER,
      });

      const result = await service.adjustMemberLevel(
        userId,
        MemberLevel.SILVER,
        adminId,
        'VIP 客戶',
      );

      expect(result.success).toBe(true);
      expect(result.user.memberLevel).toBe(MemberLevel.SILVER);
    });

    it('等級相同應直接回傳', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
      });

      const result = await service.adjustMemberLevel(
        userId,
        MemberLevel.SILVER,
        adminId,
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('adjustMemberPoints', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';

    it('應調整會員積分', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });
      // adjustMemberPoints 使用 array-based transaction
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.adjustMemberPoints(
        userId,
        100,
        adminId,
        '補償積分',
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(600);
    });

    it('積分不足應拋出錯誤', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 50,
      });

      await expect(
        service.adjustMemberPoints(userId, -100, adminId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMemberDetail', () => {
    const userId = 'user-123';

    it('應回傳會員詳細資訊含等級設定', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      });

      const result = await service.getMemberDetail(userId);

      expect(result.email).toBe('test@example.com');
      expect(result.levelConfig?.displayName).toBe('銀卡會員');
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMemberDetail(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
