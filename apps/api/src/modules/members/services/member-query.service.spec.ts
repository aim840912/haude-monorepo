import { Test, TestingModule } from '@nestjs/testing';
import { MemberQueryService } from './member-query.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MemberLevel } from '@prisma/client';

/**
 * MemberQueryService 測試
 *
 * 測試會員查詢相關的業務邏輯：
 * - 會員等級資訊查詢
 * - 升級進度計算
 * - 積分餘額和歷史查詢
 * - 等級設定查詢
 */
describe('MemberQueryService', () => {
  let service: MemberQueryService;

  // Mock Prisma
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    memberLevelConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    pointTransaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberQueryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MemberQueryService>(MemberQueryService);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 MemberQueryService', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // getLevelInfo 測試
  // ========================================

  describe('getLevelInfo', () => {
    const userId = 'user-123';

    it('應回傳會員等級完整資訊', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
        currentPoints: 1500,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        level: MemberLevel.SILVER,
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      });

      const result = await service.getLevelInfo(userId);

      expect(result).toEqual({
        level: MemberLevel.SILVER,
        displayName: '銀卡會員',
        totalSpent: 15000,
        currentPoints: 1500,
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getLevelInfo(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLevelInfo(userId)).rejects.toThrow('使用者不存在');
    });

    it('等級設定不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 0,
        currentPoints: 0,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(null);

      await expect(service.getLevelInfo(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLevelInfo(userId)).rejects.toThrow(
        '會員等級設定不存在',
      );
    });

    it('應正確查詢 user 和 memberLevelConfig', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.GOLD,
        totalSpent: 50000,
        currentPoints: 5000,
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        level: MemberLevel.GOLD,
        displayName: '金卡會員',
        discountPercent: 10,
        freeShipping: true,
        pointMultiplier: 2,
      });

      await service.getLevelInfo(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          memberLevel: true,
          totalSpent: true,
          currentPoints: true,
        },
      });
      expect(mockPrismaService.memberLevelConfig.findUnique).toHaveBeenCalledWith(
        {
          where: { level: MemberLevel.GOLD },
        },
      );
    });
  });

  // ========================================
  // getUpgradeProgress 測試
  // ========================================

  describe('getUpgradeProgress', () => {
    const userId = 'user-123';
    const allConfigs = [
      {
        level: MemberLevel.NORMAL,
        displayName: '普通會員',
        minSpent: 0,
      },
      {
        level: MemberLevel.SILVER,
        displayName: '銀卡會員',
        minSpent: 10000,
      },
      {
        level: MemberLevel.GOLD,
        displayName: '金卡會員',
        minSpent: 30000,
      },
    ];

    it('應計算正確的升級進度 (80%)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 8000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(allConfigs);

      const result = await service.getUpgradeProgress(userId);

      expect(result).toEqual({
        currentLevel: MemberLevel.NORMAL,
        currentLevelName: '普通會員',
        totalSpent: 8000,
        nextLevel: MemberLevel.SILVER,
        nextLevelName: '銀卡會員',
        amountToNextLevel: 2000,
        progressPercent: 80,
      });
    });

    it('應計算正確的升級進度 (50%)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 20000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(allConfigs);

      const result = await service.getUpgradeProgress(userId);

      expect(result).toEqual({
        currentLevel: MemberLevel.SILVER,
        currentLevelName: '銀卡會員',
        totalSpent: 20000,
        nextLevel: MemberLevel.GOLD,
        nextLevelName: '金卡會員',
        amountToNextLevel: 10000,
        progressPercent: 50,
      });
    });

    it('最高等級應回傳 100% 進度且無下一等級', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.GOLD,
        totalSpent: 50000,
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(allConfigs);

      const result = await service.getUpgradeProgress(userId);

      expect(result.currentLevel).toBe(MemberLevel.GOLD);
      expect(result.nextLevel).toBeNull();
      expect(result.nextLevelName).toBeNull();
      expect(result.amountToNextLevel).toBeNull();
      expect(result.progressPercent).toBe(100);
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUpgradeProgress(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('剛達到升級門檻應顯示 0% 或 null amountToNextLevel', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
        totalSpent: 10000, // 剛達到銀卡門檻
      });
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(allConfigs);

      const result = await service.getUpgradeProgress(userId);

      expect(result.currentLevel).toBe(MemberLevel.SILVER);
      expect(result.progressPercent).toBe(0);
      expect(result.amountToNextLevel).toBe(20000);
    });
  });

  // ========================================
  // getPointsBalance 測試
  // ========================================

  describe('getPointsBalance', () => {
    const userId = 'user-123';

    it('應回傳正確的積分餘額', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 1500,
      });

      const result = await service.getPointsBalance(userId);

      expect(result).toEqual({ balance: 1500 });
    });

    it('積分為 0 應回傳 0', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 0,
      });

      const result = await service.getPointsBalance(userId);

      expect(result).toEqual({ balance: 0 });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getPointsBalance(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應正確查詢 user 只選取 currentPoints', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });

      await service.getPointsBalance(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { currentPoints: true },
      });
    });
  });

  // ========================================
  // getPointsHistory 測試
  // ========================================

  describe('getPointsHistory', () => {
    const userId = 'user-123';
    const mockItems = [
      {
        id: 'trans-1',
        type: 'PURCHASE',
        points: 100,
        balance: 600,
        description: '消費獲得',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'trans-2',
        type: 'REDEEM',
        points: -50,
        balance: 550,
        description: '兌換商品',
        createdAt: new Date('2024-01-14'),
      },
    ];

    it('應回傳積分歷史和分頁資訊', async () => {
      mockPrismaService.pointTransaction.findMany.mockResolvedValue(mockItems);
      mockPrismaService.pointTransaction.count.mockResolvedValue(2);

      const result = await service.getPointsHistory(userId);

      expect(result).toEqual({
        items: mockItems,
        total: 2,
        hasMore: false,
      });
    });

    it('應支援自訂分頁參數', async () => {
      mockPrismaService.pointTransaction.findMany.mockResolvedValue([mockItems[0]]);
      mockPrismaService.pointTransaction.count.mockResolvedValue(100);

      const result = await service.getPointsHistory(userId, 10, 5);

      expect(mockPrismaService.pointTransaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          type: true,
          points: true,
          balance: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
      });
      expect(result.hasMore).toBe(true);
    });

    it('hasMore 應正確計算', async () => {
      // 還有更多資料的情況
      mockPrismaService.pointTransaction.findMany.mockResolvedValue(mockItems);
      mockPrismaService.pointTransaction.count.mockResolvedValue(10);

      const result = await service.getPointsHistory(userId, 2, 0);

      expect(result.hasMore).toBe(true);
    });

    it('無資料時應回傳空陣列', async () => {
      mockPrismaService.pointTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.pointTransaction.count.mockResolvedValue(0);

      const result = await service.getPointsHistory(userId);

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false,
      });
    });

    it('應使用預設分頁參數 (limit=20, offset=0)', async () => {
      mockPrismaService.pointTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.pointTransaction.count.mockResolvedValue(0);

      await service.getPointsHistory(userId);

      expect(mockPrismaService.pointTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });
  });

  // ========================================
  // getLevelConfig 測試
  // ========================================

  describe('getLevelConfig', () => {
    it('應回傳指定等級的設定', async () => {
      const mockConfig = {
        level: MemberLevel.SILVER,
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
        minSpent: 10000,
      };
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(
        mockConfig,
      );

      const result = await service.getLevelConfig(MemberLevel.SILVER);

      expect(result).toEqual(mockConfig);
      expect(mockPrismaService.memberLevelConfig.findUnique).toHaveBeenCalledWith(
        {
          where: { level: MemberLevel.SILVER },
        },
      );
    });

    it('等級不存在應回傳 null', async () => {
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(null);

      const result = await service.getLevelConfig(MemberLevel.GOLD);

      expect(result).toBeNull();
    });
  });

  // ========================================
  // getAllLevelConfigs 測試
  // ========================================

  describe('getAllLevelConfigs', () => {
    it('應回傳所有等級設定（按 minSpent 排序）', async () => {
      const mockConfigs = [
        { level: MemberLevel.NORMAL, minSpent: 0 },
        { level: MemberLevel.SILVER, minSpent: 10000 },
        { level: MemberLevel.GOLD, minSpent: 30000 },
      ];
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue(
        mockConfigs,
      );

      const result = await service.getAllLevelConfigs();

      expect(result).toEqual(mockConfigs);
      expect(mockPrismaService.memberLevelConfig.findMany).toHaveBeenCalledWith({
        orderBy: { minSpent: 'asc' },
      });
    });

    it('無設定時應回傳空陣列', async () => {
      mockPrismaService.memberLevelConfig.findMany.mockResolvedValue([]);

      const result = await service.getAllLevelConfigs();

      expect(result).toEqual([]);
    });
  });
});
