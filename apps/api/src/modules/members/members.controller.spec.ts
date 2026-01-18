import { Test, TestingModule } from '@nestjs/testing';
import {
  MembersController,
  AdminMembersController,
} from './members.controller';
import { MembersService } from './members.service';
import { MemberLevel } from '@prisma/client';

/**
 * MembersController 測試
 *
 * 測試會員相關的 API 端點：
 * - 取得會員等級資訊
 * - 取得升級進度
 * - 取得積分餘額和歷史
 * - 取得等級設定
 */
describe('MembersController', () => {
  let controller: MembersController;

  // Mock MembersService
  const mockMembersService = {
    getLevelInfo: jest.fn(),
    getUpgradeProgress: jest.fn(),
    getPointsBalance: jest.fn(),
    getPointsHistory: jest.fn(),
    getAllLevelConfigs: jest.fn(),
  };

  // Mock Request
  const mockRequest = {
    user: { userId: 'user-1', email: 'test@example.com' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 MembersController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getLevelInfo 測試
  // ========================================

  describe('getLevelInfo', () => {
    it('應回傳會員等級資訊', async () => {
      const levelInfo = {
        level: MemberLevel.GOLD,
        levelName: '黃金會員',
        pointsMultiplier: 1.5,
        totalSpent: 50000,
      };
      mockMembersService.getLevelInfo.mockResolvedValue(levelInfo);

      const result = await controller.getLevelInfo(mockRequest);

      expect(result).toEqual(levelInfo);
      expect(mockMembersService.getLevelInfo).toHaveBeenCalledWith('user-1');
    });
  });

  // ========================================
  // getUpgradeProgress 測試
  // ========================================

  describe('getUpgradeProgress', () => {
    it('應回傳升級進度', async () => {
      const progress = {
        currentLevel: MemberLevel.SILVER,
        nextLevel: MemberLevel.GOLD,
        currentSpent: 25000,
        requiredSpent: 50000,
        progressPercentage: 50,
      };
      mockMembersService.getUpgradeProgress.mockResolvedValue(progress);

      const result = await controller.getUpgradeProgress(mockRequest);

      expect(result).toEqual(progress);
      expect(mockMembersService.getUpgradeProgress).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  // ========================================
  // getPointsBalance 測試
  // ========================================

  describe('getPointsBalance', () => {
    it('應回傳積分餘額', async () => {
      const balance = {
        currentPoints: 1500,
        lifetimePoints: 5000,
        pendingPoints: 200,
      };
      mockMembersService.getPointsBalance.mockResolvedValue(balance);

      const result = await controller.getPointsBalance(mockRequest);

      expect(result).toEqual(balance);
      expect(mockMembersService.getPointsBalance).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  // ========================================
  // getPointsHistory 測試
  // ========================================

  describe('getPointsHistory', () => {
    const historyResult = {
      items: [
        { id: 'pt-1', points: 100, type: 'EARNED', createdAt: new Date() },
        { id: 'pt-2', points: -50, type: 'REDEEMED', createdAt: new Date() },
      ],
      total: 2,
    };

    it('應回傳積分歷史（使用預設分頁）', async () => {
      mockMembersService.getPointsHistory.mockResolvedValue(historyResult);

      const result = await controller.getPointsHistory(mockRequest);

      expect(result).toEqual(historyResult);
      expect(mockMembersService.getPointsHistory).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
    });

    it('應支援自訂分頁參數', async () => {
      mockMembersService.getPointsHistory.mockResolvedValue(historyResult);

      const result = await controller.getPointsHistory(mockRequest, '10', '5');

      expect(result).toEqual(historyResult);
      expect(mockMembersService.getPointsHistory).toHaveBeenCalledWith(
        'user-1',
        10,
        5,
      );
    });

    it('應正確解析字串參數為數字', async () => {
      mockMembersService.getPointsHistory.mockResolvedValue(historyResult);

      await controller.getPointsHistory(mockRequest, '50', '100');

      expect(mockMembersService.getPointsHistory).toHaveBeenCalledWith(
        'user-1',
        50,
        100,
      );
    });
  });

  // ========================================
  // getAllLevelConfigs 測試
  // ========================================

  describe('getAllLevelConfigs', () => {
    it('應回傳所有等級設定', async () => {
      const configs = [
        {
          level: MemberLevel.REGULAR,
          name: '一般會員',
          minSpent: 0,
          pointsMultiplier: 1,
        },
        {
          level: MemberLevel.SILVER,
          name: '銀牌會員',
          minSpent: 10000,
          pointsMultiplier: 1.2,
        },
        {
          level: MemberLevel.GOLD,
          name: '黃金會員',
          minSpent: 50000,
          pointsMultiplier: 1.5,
        },
      ];
      mockMembersService.getAllLevelConfigs.mockResolvedValue(configs);

      const result = await controller.getAllLevelConfigs();

      expect(result).toEqual(configs);
      expect(mockMembersService.getAllLevelConfigs).toHaveBeenCalled();
    });
  });
});

/**
 * AdminMembersController 測試
 *
 * 測試管理員會員管理 API 端點：
 * - 取得會員列表（含篩選）
 * - 取得會員詳情
 * - 取得等級變更歷史
 * - 取得積分歷史
 * - 手動調整等級
 * - 手動調整積分
 */
describe('AdminMembersController', () => {
  let controller: AdminMembersController;

  // Mock MembersService
  const mockMembersService = {
    getAdminMembersList: jest.fn(),
    getMemberDetail: jest.fn(),
    getMemberLevelHistory: jest.fn(),
    getPointsHistory: jest.fn(),
    adjustMemberLevel: jest.fn(),
    adjustMemberPoints: jest.fn(),
  };

  // Mock Request
  const mockAdminRequest = {
    user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    controller = module.get<AdminMembersController>(AdminMembersController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 AdminMembersController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getMembers 測試（會員列表）
  // ========================================

  describe('getMembers', () => {
    const membersResult = {
      items: [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '測試用戶1',
          level: MemberLevel.SILVER,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: '測試用戶2',
          level: MemberLevel.GOLD,
        },
      ],
      total: 2,
    };

    it('應回傳會員列表（無篩選）', async () => {
      mockMembersService.getAdminMembersList.mockResolvedValue(membersResult);

      const result = await controller.getMembers();

      expect(result).toEqual(membersResult);
      expect(mockMembersService.getAdminMembersList).toHaveBeenCalledWith({
        level: undefined,
        search: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('應支援等級篩選', async () => {
      mockMembersService.getAdminMembersList.mockResolvedValue(membersResult);

      await controller.getMembers(MemberLevel.GOLD);

      expect(mockMembersService.getAdminMembersList).toHaveBeenCalledWith({
        level: MemberLevel.GOLD,
        search: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('應支援關鍵字搜尋', async () => {
      mockMembersService.getAdminMembersList.mockResolvedValue(membersResult);

      await controller.getMembers(undefined, '測試');

      expect(mockMembersService.getAdminMembersList).toHaveBeenCalledWith({
        level: undefined,
        search: '測試',
        limit: 20,
        offset: 0,
      });
    });

    it('應支援自訂分頁參數', async () => {
      mockMembersService.getAdminMembersList.mockResolvedValue(membersResult);

      await controller.getMembers(undefined, undefined, '50', '100');

      expect(mockMembersService.getAdminMembersList).toHaveBeenCalledWith({
        level: undefined,
        search: undefined,
        limit: 50,
        offset: 100,
      });
    });

    it('應同時支援所有篩選條件', async () => {
      mockMembersService.getAdminMembersList.mockResolvedValue(membersResult);

      await controller.getMembers(MemberLevel.SILVER, 'test', '10', '20');

      expect(mockMembersService.getAdminMembersList).toHaveBeenCalledWith({
        level: MemberLevel.SILVER,
        search: 'test',
        limit: 10,
        offset: 20,
      });
    });
  });

  // ========================================
  // getMemberDetail 測試
  // ========================================

  describe('getMemberDetail', () => {
    it('應回傳會員詳情', async () => {
      const memberDetail = {
        id: 'user-1',
        email: 'user1@example.com',
        name: '測試用戶',
        level: MemberLevel.GOLD,
        totalSpent: 75000,
        currentPoints: 2500,
        createdAt: new Date(),
      };
      mockMembersService.getMemberDetail.mockResolvedValue(memberDetail);

      const result = await controller.getMemberDetail('user-1');

      expect(result).toEqual(memberDetail);
      expect(mockMembersService.getMemberDetail).toHaveBeenCalledWith('user-1');
    });
  });

  // ========================================
  // getLevelHistory 測試
  // ========================================

  describe('getLevelHistory', () => {
    const historyResult = {
      items: [
        {
          id: 'lh-1',
          fromLevel: MemberLevel.SILVER,
          toLevel: MemberLevel.GOLD,
          reason: '累積消費達標',
          createdAt: new Date(),
        },
      ],
      total: 1,
    };

    it('應回傳等級變更歷史（使用預設分頁）', async () => {
      mockMembersService.getMemberLevelHistory.mockResolvedValue(historyResult);

      const result = await controller.getLevelHistory('user-1');

      expect(result).toEqual(historyResult);
      expect(mockMembersService.getMemberLevelHistory).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
    });

    it('應支援自訂分頁參數', async () => {
      mockMembersService.getMemberLevelHistory.mockResolvedValue(historyResult);

      const result = await controller.getLevelHistory('user-1', '10', '5');

      expect(result).toEqual(historyResult);
      expect(mockMembersService.getMemberLevelHistory).toHaveBeenCalledWith(
        'user-1',
        10,
        5,
      );
    });
  });

  // ========================================
  // getPointsHistory 測試（管理端）
  // ========================================

  describe('getPointsHistory', () => {
    const historyResult = {
      items: [
        { id: 'pt-1', points: 500, type: 'EARNED', createdAt: new Date() },
      ],
      total: 1,
    };

    it('應回傳指定會員的積分歷史', async () => {
      mockMembersService.getPointsHistory.mockResolvedValue(historyResult);

      const result = await controller.getPointsHistory('user-1');

      expect(result).toEqual(historyResult);
      expect(mockMembersService.getPointsHistory).toHaveBeenCalledWith(
        'user-1',
        20,
        0,
      );
    });

    it('應支援自訂分頁參數', async () => {
      mockMembersService.getPointsHistory.mockResolvedValue(historyResult);

      await controller.getPointsHistory('user-1', '30', '60');

      expect(mockMembersService.getPointsHistory).toHaveBeenCalledWith(
        'user-1',
        30,
        60,
      );
    });
  });

  // ========================================
  // adjustLevel 測試
  // ========================================

  describe('adjustLevel', () => {
    it('應成功調整會員等級', async () => {
      const adjustResult = {
        id: 'user-1',
        level: MemberLevel.PLATINUM,
        message: '等級已調整',
      };
      mockMembersService.adjustMemberLevel.mockResolvedValue(adjustResult);

      const result = await controller.adjustLevel(
        'user-1',
        { level: MemberLevel.PLATINUM, reason: 'VIP 客戶' },
        mockAdminRequest,
      );

      expect(result).toEqual(adjustResult);
      expect(mockMembersService.adjustMemberLevel).toHaveBeenCalledWith(
        'user-1',
        MemberLevel.PLATINUM,
        'admin-1',
        'VIP 客戶',
      );
    });

    it('應正確傳遞管理員 ID', async () => {
      mockMembersService.adjustMemberLevel.mockResolvedValue({});

      await controller.adjustLevel(
        'user-2',
        { level: MemberLevel.GOLD, reason: undefined },
        { user: { userId: 'admin-2' } } as any,
      );

      expect(mockMembersService.adjustMemberLevel).toHaveBeenCalledWith(
        'user-2',
        MemberLevel.GOLD,
        'admin-2',
        undefined,
      );
    });
  });

  // ========================================
  // adjustPoints 測試
  // ========================================

  describe('adjustPoints', () => {
    it('應成功調整會員積分（正數）', async () => {
      const adjustResult = {
        id: 'user-1',
        currentPoints: 2500,
        message: '積分已調整',
      };
      mockMembersService.adjustMemberPoints.mockResolvedValue(adjustResult);

      const result = await controller.adjustPoints(
        'user-1',
        { points: 500, reason: '活動贈點' },
        mockAdminRequest,
      );

      expect(result).toEqual(adjustResult);
      expect(mockMembersService.adjustMemberPoints).toHaveBeenCalledWith(
        'user-1',
        500,
        'admin-1',
        '活動贈點',
      );
    });

    it('應成功調整會員積分（負數）', async () => {
      mockMembersService.adjustMemberPoints.mockResolvedValue({
        currentPoints: 1500,
      });

      await controller.adjustPoints(
        'user-1',
        { points: -500, reason: '積分過期' },
        mockAdminRequest,
      );

      expect(mockMembersService.adjustMemberPoints).toHaveBeenCalledWith(
        'user-1',
        -500,
        'admin-1',
        '積分過期',
      );
    });

    it('應正確傳遞管理員 ID 和原因', async () => {
      mockMembersService.adjustMemberPoints.mockResolvedValue({});

      await controller.adjustPoints(
        'user-3',
        { points: 1000, reason: '客訴補償' },
        { user: { userId: 'admin-3' } } as any,
      );

      expect(mockMembersService.adjustMemberPoints).toHaveBeenCalledWith(
        'user-3',
        1000,
        'admin-3',
        '客訴補償',
      );
    });
  });
});
