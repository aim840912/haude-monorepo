import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { MemberQueryService } from './services/member-query.service';
import { MemberPointsService } from './services/member-points.service';
import { MemberAdminService } from './services/member-admin.service';
import { MemberLevel } from '@prisma/client';

/**
 * MembersService Facade 測試
 *
 * 由於 MembersService 現在是 Facade 模式，只負責委派到專責子服務，
 * 這裡的測試主要驗證委派行為是否正確。
 * 詳細的業務邏輯測試應在各子服務的測試檔案中進行。
 */
describe('MembersService (Facade)', () => {
  let service: MembersService;
  let queryService: jest.Mocked<MemberQueryService>;
  let pointsService: jest.Mocked<MemberPointsService>;
  let adminService: jest.Mocked<MemberAdminService>;

  // Mock MemberQueryService
  const mockQueryService = {
    getLevelInfo: jest.fn(),
    getUpgradeProgress: jest.fn(),
    getPointsBalance: jest.fn(),
    getPointsHistory: jest.fn(),
    getLevelConfig: jest.fn(),
    getAllLevelConfigs: jest.fn(),
  };

  // Mock MemberPointsService
  const mockPointsService = {
    checkAndUpgradeLevel: jest.fn(),
    addPointsForPurchase: jest.fn(),
    updateTotalSpentAndCheckUpgrade: jest.fn(),
  };

  // Mock MemberAdminService
  const mockAdminService = {
    getMembersList: jest.fn(),
    getLevelHistory: jest.fn(),
    adjustLevel: jest.fn(),
    adjustPoints: jest.fn(),
    getMemberDetail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: MemberQueryService,
          useValue: mockQueryService,
        },
        {
          provide: MemberPointsService,
          useValue: mockPointsService,
        },
        {
          provide: MemberAdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    queryService = module.get(MemberQueryService);
    pointsService = module.get(MemberPointsService);
    adminService = module.get(MemberAdminService);

    jest.clearAllMocks();
  });

  describe('Facade 初始化', () => {
    it('應成功建立 MembersService', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // Query Methods 委派測試
  // ========================================

  describe('getLevelInfo', () => {
    const userId = 'user-123';
    const mockResult = {
      level: MemberLevel.SILVER,
      displayName: '銀卡會員',
      totalSpent: 15000,
      currentPoints: 1500,
      discountPercent: 5,
      freeShipping: false,
      pointMultiplier: 1.5,
    };

    it('應委派至 QueryService.getLevelInfo', async () => {
      mockQueryService.getLevelInfo.mockResolvedValue(mockResult);

      const result = await service.getLevelInfo(userId);

      expect(queryService.getLevelInfo).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUpgradeProgress', () => {
    const userId = 'user-123';
    const mockResult = {
      currentLevel: MemberLevel.NORMAL,
      currentLevelName: '普通會員',
      nextLevel: MemberLevel.SILVER,
      nextLevelName: '銀卡會員',
      currentSpent: 8000,
      nextLevelMinSpent: 10000,
      amountToNextLevel: 2000,
      progressPercent: 80,
    };

    it('應委派至 QueryService.getUpgradeProgress', async () => {
      mockQueryService.getUpgradeProgress.mockResolvedValue(mockResult);

      const result = await service.getUpgradeProgress(userId);

      expect(queryService.getUpgradeProgress).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPointsBalance', () => {
    const userId = 'user-123';
    const mockResult = { balance: 1500 };

    it('應委派至 QueryService.getPointsBalance', async () => {
      mockQueryService.getPointsBalance.mockResolvedValue(mockResult);

      const result = await service.getPointsBalance(userId);

      expect(queryService.getPointsBalance).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPointsHistory', () => {
    const userId = 'user-123';
    const mockResult = {
      items: [
        {
          id: 'trans-1',
          type: 'PURCHASE',
          points: 100,
          balance: 600,
          description: '消費獲得',
          createdAt: new Date(),
        },
      ],
      total: 1,
      hasMore: false,
    };

    it('應委派至 QueryService.getPointsHistory（使用預設參數）', async () => {
      mockQueryService.getPointsHistory.mockResolvedValue(mockResult);

      const result = await service.getPointsHistory(userId);

      expect(queryService.getPointsHistory).toHaveBeenCalledWith(userId, 20, 0);
      expect(result).toEqual(mockResult);
    });

    it('應委派至 QueryService.getPointsHistory（使用自訂參數）', async () => {
      mockQueryService.getPointsHistory.mockResolvedValue(mockResult);

      const result = await service.getPointsHistory(userId, 10, 5);

      expect(queryService.getPointsHistory).toHaveBeenCalledWith(userId, 10, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLevelConfig', () => {
    const mockConfig = {
      level: MemberLevel.SILVER,
      displayName: '銀卡會員',
      discountPercent: 5,
      freeShipping: false,
      pointMultiplier: 1.5,
      minSpent: 10000,
    };

    it('應委派至 QueryService.getLevelConfig', async () => {
      mockQueryService.getLevelConfig.mockResolvedValue(mockConfig);

      const result = await service.getLevelConfig(MemberLevel.SILVER);

      expect(queryService.getLevelConfig).toHaveBeenCalledWith(
        MemberLevel.SILVER,
      );
      expect(result).toEqual(mockConfig);
    });
  });

  describe('getAllLevelConfigs', () => {
    const mockConfigs = [
      { level: MemberLevel.NORMAL, minSpent: 0 },
      { level: MemberLevel.SILVER, minSpent: 10000 },
      { level: MemberLevel.GOLD, minSpent: 30000 },
    ];

    it('應委派至 QueryService.getAllLevelConfigs', async () => {
      mockQueryService.getAllLevelConfigs.mockResolvedValue(mockConfigs);

      const result = await service.getAllLevelConfigs();

      expect(queryService.getAllLevelConfigs).toHaveBeenCalled();
      expect(result).toEqual(mockConfigs);
    });
  });

  // ========================================
  // Points Methods 委派測試
  // ========================================

  describe('checkAndUpgradeLevel', () => {
    const userId = 'user-123';

    it('應委派至 PointsService.checkAndUpgradeLevel', async () => {
      mockPointsService.checkAndUpgradeLevel.mockResolvedValue(true);

      const result = await service.checkAndUpgradeLevel(userId);

      expect(pointsService.checkAndUpgradeLevel).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });
  });

  describe('addPointsForPurchase', () => {
    const userId = 'user-123';
    const orderId = 'order-123';
    const orderAmount = 1000;

    it('應委派至 PointsService.addPointsForPurchase', async () => {
      mockPointsService.addPointsForPurchase.mockResolvedValue(1500);

      const result = await service.addPointsForPurchase(
        userId,
        orderAmount,
        orderId,
      );

      expect(pointsService.addPointsForPurchase).toHaveBeenCalledWith(
        userId,
        orderAmount,
        orderId,
      );
      expect(result).toBe(1500);
    });
  });

  describe('updateTotalSpentAndCheckUpgrade', () => {
    const userId = 'user-123';
    const orderAmount = 5000;
    const mockResult = { newTotalSpent: 15000, upgraded: true };

    it('應委派至 PointsService.updateTotalSpentAndCheckUpgrade', async () => {
      mockPointsService.updateTotalSpentAndCheckUpgrade.mockResolvedValue(
        mockResult,
      );

      const result = await service.updateTotalSpentAndCheckUpgrade(
        userId,
        orderAmount,
      );

      expect(
        pointsService.updateTotalSpentAndCheckUpgrade,
      ).toHaveBeenCalledWith(userId, orderAmount);
      expect(result).toEqual(mockResult);
    });
  });

  // ========================================
  // Admin Methods 委派測試
  // ========================================

  describe('getAdminMembersList', () => {
    const options = { level: MemberLevel.SILVER, limit: 10, offset: 0 };
    const mockResult = {
      items: [{ id: 'user-1', email: 'test@example.com' }],
      total: 1,
      hasMore: false,
    };

    it('應委派至 AdminService.getMembersList', async () => {
      mockAdminService.getMembersList.mockResolvedValue(mockResult);

      const result = await service.getAdminMembersList(options);

      expect(adminService.getMembersList).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMemberLevelHistory', () => {
    const userId = 'user-123';
    const mockResult = {
      items: [
        {
          id: 'hist-1',
          fromLevel: MemberLevel.NORMAL,
          toLevel: MemberLevel.SILVER,
          reason: '消費升級',
          createdAt: new Date(),
        },
      ],
      total: 1,
      hasMore: false,
    };

    it('應委派至 AdminService.getLevelHistory（使用預設參數）', async () => {
      mockAdminService.getLevelHistory.mockResolvedValue(mockResult);

      const result = await service.getMemberLevelHistory(userId);

      expect(adminService.getLevelHistory).toHaveBeenCalledWith(userId, 20, 0);
      expect(result).toEqual(mockResult);
    });

    it('應委派至 AdminService.getLevelHistory（使用自訂參數）', async () => {
      mockAdminService.getLevelHistory.mockResolvedValue(mockResult);

      const result = await service.getMemberLevelHistory(userId, 10, 5);

      expect(adminService.getLevelHistory).toHaveBeenCalledWith(userId, 10, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('adjustMemberLevel', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';
    const newLevel = MemberLevel.SILVER;
    const reason = 'VIP 客戶';
    const mockResult = {
      success: true,
      user: { id: userId, memberLevel: newLevel },
    };

    it('應委派至 AdminService.adjustLevel', async () => {
      mockAdminService.adjustLevel.mockResolvedValue(mockResult);

      const result = await service.adjustMemberLevel(
        userId,
        newLevel,
        adminId,
        reason,
      );

      expect(adminService.adjustLevel).toHaveBeenCalledWith(
        userId,
        newLevel,
        adminId,
        reason,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('adjustMemberPoints', () => {
    const userId = 'user-123';
    const adminId = 'admin-1';
    const points = 100;
    const reason = '補償積分';
    const mockResult = { success: true, newBalance: 600 };

    it('應委派至 AdminService.adjustPoints', async () => {
      mockAdminService.adjustPoints.mockResolvedValue(mockResult);

      const result = await service.adjustMemberPoints(
        userId,
        points,
        adminId,
        reason,
      );

      expect(adminService.adjustPoints).toHaveBeenCalledWith(
        userId,
        points,
        adminId,
        reason,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMemberDetail', () => {
    const userId = 'user-123';
    const mockResult = {
      id: userId,
      email: 'test@example.com',
      memberLevel: MemberLevel.SILVER,
      totalSpent: 15000,
      currentPoints: 1500,
      levelConfig: {
        displayName: '銀卡會員',
        discountPercent: 5,
        freeShipping: false,
        pointMultiplier: 1.5,
      },
    };

    it('應委派至 AdminService.getMemberDetail', async () => {
      mockAdminService.getMemberDetail.mockResolvedValue(mockResult);

      const result = await service.getMemberDetail(userId);

      expect(adminService.getMemberDetail).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });
});
