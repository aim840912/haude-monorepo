import { Test, TestingModule } from '@nestjs/testing';
import { MemberAdminService } from './member-admin.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MemberLevel } from '@prisma/client';

/**
 * MemberAdminService 測試
 *
 * 測試會員管理後台的業務邏輯：
 * - 會員列表查詢（含篩選和搜尋）
 * - 會員等級變更歷史
 * - 手動調整會員等級
 * - 手動調整會員積分
 * - 會員詳細資訊查詢
 */
describe('MemberAdminService', () => {
  let service: MemberAdminService;

  // Mock Prisma
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    memberLevelConfig: {
      findUnique: jest.fn(),
    },
    memberLevelHistory: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberAdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MemberAdminService>(MemberAdminService);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 MemberAdminService', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // getMembersList 測試
  // ========================================

  describe('getMembersList', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'silver@test.com',
        name: '銀卡用戶',
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
        currentPoints: 1500,
        levelUpdatedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'normal@test.com',
        name: '普通用戶',
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 5000,
        currentPoints: 500,
        levelUpdatedAt: null,
        createdAt: new Date(),
      },
    ];

    it('應回傳會員列表和分頁資訊', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.getMembersList({});

      expect(result).toEqual({
        items: mockUsers,
        total: 2,
        hasMore: false,
      });
    });

    it('應支援等級篩選', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.getMembersList({ level: MemberLevel.SILVER });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberLevel: MemberLevel.SILVER,
          }),
        }),
      );
    });

    it('應支援搜尋（email 或 name）', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.getMembersList({ search: '銀卡' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { email: { contains: '銀卡', mode: 'insensitive' } },
              { name: { contains: '銀卡', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('應支援等級篩選 + 搜尋組合', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getMembersList({
        level: MemberLevel.GOLD,
        search: 'test',
      });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberLevel: MemberLevel.GOLD,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('應支援分頁參數', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.user.count.mockResolvedValue(50);

      const result = await service.getMembersList({ limit: 10, offset: 5 });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
      expect(result.hasMore).toBe(true);
    });

    it('應使用預設分頁參數', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getMembersList({});

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });
  });

  // ========================================
  // getLevelHistory 測試
  // ========================================

  describe('getLevelHistory', () => {
    const userId = 'user-123';
    const mockHistory = [
      {
        id: 'hist-1',
        fromLevel: MemberLevel.NORMAL,
        toLevel: MemberLevel.SILVER,
        reason: '消費升級',
        triggeredBy: 'system',
        createdAt: new Date('2024-01-15'),
      },
    ];

    it('應回傳等級變更歷史', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.memberLevelHistory.findMany.mockResolvedValue(
        mockHistory,
      );
      mockPrismaService.memberLevelHistory.count.mockResolvedValue(1);

      const result = await service.getLevelHistory(userId);

      expect(result).toEqual({
        items: mockHistory,
        total: 1,
        hasMore: false,
      });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getLevelHistory(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應支援分頁參數', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.memberLevelHistory.findMany.mockResolvedValue([]);
      mockPrismaService.memberLevelHistory.count.mockResolvedValue(100);

      const result = await service.getLevelHistory(userId, 10, 5);

      expect(
        mockPrismaService.memberLevelHistory.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
      expect(result.hasMore).toBe(true);
    });

    it('無歷史記錄應回傳空陣列', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.memberLevelHistory.findMany.mockResolvedValue([]);
      mockPrismaService.memberLevelHistory.count.mockResolvedValue(0);

      const result = await service.getLevelHistory(userId);

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false,
      });
    });
  });

  // ========================================
  // adjustLevel 測試
  // ========================================

  describe('adjustLevel', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';

    it('應調整會員等級並記錄歷史', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        memberLevel: MemberLevel.SILVER,
      });

      const result = await service.adjustLevel(
        userId,
        MemberLevel.SILVER,
        adminId,
        'VIP 客戶',
      );

      expect(result).toEqual({
        success: true,
        user: { id: userId, memberLevel: MemberLevel.SILVER },
      });
    });

    it('等級相同應直接回傳成功（不更新）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
      });

      const result = await service.adjustLevel(
        userId,
        MemberLevel.SILVER,
        adminId,
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.adjustLevel(userId, MemberLevel.GOLD, adminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('應記錄等級變更歷史', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.NORMAL,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        memberLevel: MemberLevel.GOLD,
      });

      await service.adjustLevel(userId, MemberLevel.GOLD, adminId, '特殊優惠');

      expect(mockPrismaService.memberLevelHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          fromLevel: MemberLevel.NORMAL,
          toLevel: MemberLevel.GOLD,
          reason: '特殊優惠',
          triggeredBy: adminId,
        }),
      });
    });

    it('未提供 reason 應使用預設值', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        memberLevel: MemberLevel.SILVER,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        memberLevel: MemberLevel.NORMAL,
      });

      await service.adjustLevel(userId, MemberLevel.NORMAL, adminId);

      expect(mockPrismaService.memberLevelHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: '管理員手動調整',
        }),
      });
    });
  });

  // ========================================
  // adjustPoints 測試
  // ========================================

  describe('adjustPoints', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';

    it('應增加會員積分', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });

      const result = await service.adjustPoints(
        userId,
        100,
        adminId,
        '補償積分',
      );

      expect(result).toEqual({
        success: true,
        newBalance: 600,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { currentPoints: 600 },
      });
    });

    it('應扣除會員積分', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });

      const result = await service.adjustPoints(
        userId,
        -200,
        adminId,
        '扣除濫用積分',
      );

      expect(result).toEqual({
        success: true,
        newBalance: 300,
      });
    });

    it('積分不足應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 50,
      });

      await expect(service.adjustPoints(userId, -100, adminId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.adjustPoints(userId, 100, adminId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應建立積分交易記錄', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });

      await service.adjustPoints(userId, 100, adminId, '活動獎勵');

      expect(mockPrismaService.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'ADJUSTMENT',
          points: 100,
          balance: 600,
          description: '活動獎勵',
        }),
      });
    });

    it('未提供 reason 應使用預設描述', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentPoints: 500,
      });

      await service.adjustPoints(userId, 100, adminId);

      expect(mockPrismaService.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: `管理員調整 (${adminId})`,
        }),
      });
    });
  });

  // ========================================
  // getMemberDetail 測試
  // ========================================

  describe('getMemberDetail', () => {
    const userId = 'user-123';

    it('應回傳會員詳細資訊含等級設定', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: '測試用戶',
        memberLevel: MemberLevel.SILVER,
        totalSpent: 15000,
        currentPoints: 1500,
        birthday: new Date('1990-05-15'),
        levelUpdatedAt: new Date('2024-01-01'),
        createdAt: new Date('2023-01-01'),
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue({
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      });

      const result = await service.getMemberDetail(userId);

      expect(result.email).toBe('test@example.com');
      expect(result.memberLevel).toBe(MemberLevel.SILVER);
      expect(result.levelConfig).toEqual({
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      });
    });

    it('使用者不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMemberDetail(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('等級設定不存在應回傳 levelConfig: null', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: '測試用戶',
        memberLevel: MemberLevel.NORMAL,
        totalSpent: 0,
        currentPoints: 0,
        birthday: null,
        levelUpdatedAt: null,
        createdAt: new Date(),
      });
      mockPrismaService.memberLevelConfig.findUnique.mockResolvedValue(null);

      const result = await service.getMemberDetail(userId);

      expect(result.levelConfig).toBeNull();
    });
  });
});
