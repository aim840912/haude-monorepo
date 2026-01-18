/**
 * 會員系統 E2E 測試
 *
 * 測試會員等級與積分功能：
 * - 用戶端點：會員等級、升級進度、積分餘額、積分歷史
 * - 管理員端點：會員列表、會員詳情、調整等級、調整積分
 *
 * 注意：由於 MembersService 被 mock，測試直接配置 mockMembers
 */

import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockMembersService,
  createMockUser,
  createMockMember,
} from './utils/test-helpers';

describe('Members API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockMembers: ReturnType<typeof createMockMembersService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;
    mockMembers = testApp.mockMembers;

    // 預設 mock：用戶存在（用於 JWT 驗證）
    const mockUser = createMockUser({ id: 'user-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 用戶端點：會員等級資訊
  // ========================================

  describe('GET /members/me/level', () => {
    it('應該返回會員等級資訊', async () => {
      mockMembers.getLevelInfo.mockResolvedValue({
        level: 'SILVER',
        discountPercent: 5,
        freeShipping: false,
        pointsMultiplier: 1.5,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/members/me/level')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.level).toBe('SILVER');
      expect(response.body.discountPercent).toBe(5);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/me/level')
        .expect(401);
    });
  });

  describe('GET /members/me/upgrade-progress', () => {
    it('應該返回升級進度', async () => {
      mockMembers.getUpgradeProgress.mockResolvedValue({
        currentLevel: 'NORMAL',
        nextLevel: 'SILVER',
        progress: 30,
        remainingAmount: 3500,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/members/me/upgrade-progress')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.currentLevel).toBe('NORMAL');
      expect(response.body.nextLevel).toBe('SILVER');
      expect(response.body.progress).toBe(30);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/me/upgrade-progress')
        .expect(401);
    });
  });

  // ========================================
  // 用戶端點：積分
  // ========================================

  describe('GET /members/me/points', () => {
    it('應該返回積分餘額', async () => {
      mockMembers.getPointsBalance.mockResolvedValue({
        balance: 500,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/members/me/points')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.balance).toBe(500);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/me/points')
        .expect(401);
    });
  });

  describe('GET /members/me/points/history', () => {
    it('應該返回積分歷史', async () => {
      mockMembers.getPointsHistory.mockResolvedValue({
        data: [
          { id: 'txn-1', points: 100, type: 'EARN', createdAt: new Date() },
          { id: 'txn-2', points: -50, type: 'REDEEM', createdAt: new Date() },
        ],
        total: 2,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/members/me/points/history')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('應該支援分頁參數', async () => {
      mockMembers.getPointsHistory.mockResolvedValue({
        data: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/api/v1/members/me/points/history')
        .query({ limit: 10, offset: 20 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(mockMembers.getPointsHistory).toHaveBeenCalledWith(
        'user-123',
        10,
        20,
      );
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/me/points/history')
        .expect(401);
    });
  });

  // ========================================
  // 用戶端點：等級設定
  // ========================================

  describe('GET /members/level-configs', () => {
    it('應該返回所有等級設定', async () => {
      mockMembers.getAllLevelConfigs.mockResolvedValue([
        {
          level: 'NORMAL',
          minSpent: 0,
          discountPercent: 0,
          freeShipping: false,
          pointsMultiplier: 1,
        },
        {
          level: 'SILVER',
          minSpent: 5000,
          discountPercent: 5,
          freeShipping: false,
          pointsMultiplier: 1.5,
        },
        {
          level: 'GOLD',
          minSpent: 15000,
          discountPercent: 10,
          freeShipping: true,
          pointsMultiplier: 2,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/members/level-configs')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/level-configs')
        .expect(401);
    });
  });

  // ========================================
  // 管理員端點：會員列表
  // ========================================

  describe('GET /admin/members', () => {
    it('應該返回會員列表（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockMembers.getAdminMembersList.mockResolvedValue({
        data: [
          createMockMember({ id: 'member-1', memberLevel: 'SILVER' }),
          createMockMember({ id: 'member-2', memberLevel: 'GOLD' }),
        ],
        total: 2,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/members')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('應該支援等級篩選', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockMembers.getAdminMembersList.mockResolvedValue({
        data: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/api/v1/admin/members')
        .query({ level: 'GOLD' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(mockMembers.getAdminMembersList).toHaveBeenCalled();
    });

    it('應該支援搜尋', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockMembers.getAdminMembersList.mockResolvedValue({
        data: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/api/v1/admin/members')
        .query({ search: 'test@example.com' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/members')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：會員詳情
  // ========================================

  describe('GET /admin/members/:id', () => {
    it('應該返回會員詳情', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      mockMembers.getMemberDetail.mockResolvedValue(
        createMockMember({
          id: memberId,
          memberLevel: 'GOLD',
          totalSpent: 20000,
          points: 1500,
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/members/${memberId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.id).toBe(memberId);
      expect(response.body.memberLevel).toBe('GOLD');
    });

    it('應該返回 404 當會員不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockMembers.getMemberDetail.mockRejectedValue(
        new NotFoundException('會員不存在'),
      );

      await request(app.getHttpServer())
        .get('/api/v1/admin/members/nonexistent-id')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/members/member-id')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：會員等級歷史
  // ========================================

  describe('GET /admin/members/:id/level-history', () => {
    it('應該返回會員等級變更歷史', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      mockMembers.getMemberLevelHistory.mockResolvedValue({
        data: [
          {
            id: 'history-1',
            previousLevel: 'NORMAL',
            newLevel: 'SILVER',
            reason: '累計消費達標',
          },
        ],
        total: 1,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/members/${memberId}/level-history`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/members/member-id/level-history')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：調整會員等級
  // ========================================

  describe('PATCH /admin/members/:id/level', () => {
    it('應該成功調整會員等級', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      mockMembers.adjustMemberLevel.mockResolvedValue(
        createMockMember({
          id: memberId,
          memberLevel: 'GOLD',
        }),
      );

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/members/${memberId}/level`)
        .set(authHeader('mock-jwt-token'))
        .send({ level: 'GOLD', reason: '手動升級' })
        .expect(200);

      expect(response.body.memberLevel).toBe('GOLD');
    });

    it('應該驗證必要欄位', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/members/member-id/level')
        .set(authHeader('mock-jwt-token'))
        .send({}) // 缺少 level
        .expect(400);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/members/member-id/level')
        .set(authHeader('mock-jwt-token'))
        .send({ level: 'GOLD' })
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：調整會員積分
  // ========================================

  describe('PATCH /admin/members/:id/points', () => {
    it('應該成功增加會員積分', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      mockMembers.adjustMemberPoints.mockResolvedValue({
        newBalance: 600,
        transaction: { id: 'txn-1', points: 100 },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/members/${memberId}/points`)
        .set(authHeader('mock-jwt-token'))
        .send({ points: 100, reason: '促銷活動獎勵' })
        .expect(200);

      expect(response.body.newBalance).toBe(600);
    });

    it('應該成功扣除會員積分', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      mockMembers.adjustMemberPoints.mockResolvedValue({
        newBalance: 400,
        transaction: { id: 'txn-2', points: -100 },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/members/${memberId}/points`)
        .set(authHeader('mock-jwt-token'))
        .send({ points: -100, reason: '積分修正' })
        .expect(200);

      expect(response.body.newBalance).toBe(400);
    });

    it('應該驗證必要欄位', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/members/member-id/points')
        .set(authHeader('mock-jwt-token'))
        .send({}) // 缺少 points
        .expect(400);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/members/member-id/points')
        .set(authHeader('mock-jwt-token'))
        .send({ points: 100 })
        .expect(403);
    });
  });
});
