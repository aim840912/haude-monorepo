/**
 * 農場導覽 E2E 測試
 *
 * 測試功能：
 * - 公開端點：列表、詳情、即將舉辦
 * - 認證端點：預約、我的預約、取消預約
 * - 管理員端點：CRUD 操作
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockFarmTour,
  createMockBooking,
} from './utils/test-helpers';

describe('Farm Tours API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;

    // 預設 mock：一般用戶
    const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
    mockPrisma.user.findUnique.mockResolvedValue(normalUser);
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 公開端點
  // ========================================

  describe('GET /farm-tours', () => {
    it('應該返回所有啟用的農場導覽', async () => {
      const mockTours = [
        createMockFarmTour({ id: 'tour-1', name: '春季採茶' }),
        createMockFarmTour({ id: 'tour-2', name: '製茶體驗' }),
      ];

      mockPrisma.farmTour.findMany.mockResolvedValue(mockTours);

      const response = await request(app.getHttpServer())
        .get('/api/v1/farm-tours')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('春季採茶');
    });

    it('應該返回空陣列當沒有農場導覽', async () => {
      mockPrisma.farmTour.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/farm-tours')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /farm-tours/upcoming', () => {
    it('應該返回即將舉辦的農場導覽', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockTours = [
        createMockFarmTour({
          id: 'tour-1',
          name: '下週導覽',
          date: futureDate,
        }),
      ];

      mockPrisma.farmTour.findMany.mockResolvedValue(mockTours);

      const response = await request(app.getHttpServer())
        .get('/api/v1/farm-tours/upcoming')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /farm-tours/:id', () => {
    it('應該返回農場導覽詳情', async () => {
      const tourId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTour = createMockFarmTour({
        id: tourId,
        name: '茶園一日遊',
        bookings: [],
      });

      mockPrisma.farmTour.findUnique.mockResolvedValue(mockTour);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/farm-tours/${tourId}`)
        .expect(200);

      expect(response.body.id).toBe(tourId);
      expect(response.body.name).toBe('茶園一日遊');
    });

    it('應該返回 404 當農場導覽不存在', async () => {
      mockPrisma.farmTour.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/farm-tours/550e8400-e29b-41d4-a716-446655440001')
        .expect(404);
    });
  });

  // ========================================
  // 認證端點（需要登入）
  // ========================================

  describe('POST /farm-tours/bookings', () => {
    it('應該成功建立預約', async () => {
      const tourId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTour = createMockFarmTour({
        id: tourId,
        maxParticipants: 20,
        currentParticipants: 5,
        price: 1500,
        bookings: [],
      });

      const mockBooking = createMockBooking({
        id: 'booking-1',
        tourId,
        userId: 'user-1',
        participants: 2,
        totalAmount: 3000,
      });

      mockPrisma.farmTour.findUnique.mockResolvedValue(mockTour);
      mockPrisma.farmTourBooking.create.mockResolvedValue(mockBooking);
      mockPrisma.farmTour.update.mockResolvedValue({
        ...mockTour,
        currentParticipants: 7,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/farm-tours/bookings')
        .set(authHeader('mock-jwt-token'))
        .send({
          tourId,
          participants: 2,
          contactName: '測試聯絡人',
          contactPhone: '0912345678',
        })
        .expect(201);

      expect(response.body.id).toBe('booking-1');
      expect(response.body.participants).toBe(2);
    });

    it('應該拒絕未登入的請求', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/farm-tours/bookings')
        .send({
          tourId: '550e8400-e29b-41d4-a716-446655440000',
          participants: 2,
        })
        .expect(401);
    });

    it('應該拒絕超過可用名額的預約', async () => {
      const tourId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTour = createMockFarmTour({
        id: tourId,
        maxParticipants: 20,
        currentParticipants: 19,
        bookings: [],
      });

      mockPrisma.farmTour.findUnique.mockResolvedValue(mockTour);

      await request(app.getHttpServer())
        .post('/api/v1/farm-tours/bookings')
        .set(authHeader('mock-jwt-token'))
        .send({
          tourId,
          participants: 5,
          contactName: '測試聯絡人',
          contactPhone: '0912345678',
        })
        .expect(400);
    });
  });

  describe('GET /farm-tours/bookings/my', () => {
    it('應該返回使用者的預約列表', async () => {
      const mockBookings = [
        createMockBooking({
          id: 'booking-1',
          userId: 'user-1',
          farmTour: createMockFarmTour({ id: 'tour-1' }),
        }),
      ];

      mockPrisma.farmTourBooking.findMany.mockResolvedValue(mockBookings);

      const response = await request(app.getHttpServer())
        .get('/api/v1/farm-tours/bookings/my')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('應該拒絕未登入的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/farm-tours/bookings/my')
        .expect(401);
    });
  });

  describe('PATCH /farm-tours/bookings/:id/cancel', () => {
    it('應該成功取消預約', async () => {
      const bookingId = '550e8400-e29b-41d4-a716-446655440000';
      const mockBooking = createMockBooking({
        id: bookingId,
        userId: 'user-1',
        tourId: 'tour-1',
        status: 'confirmed',
        participants: 2,
      });

      mockPrisma.farmTourBooking.findUnique.mockResolvedValue(mockBooking);
      // $transaction 需要返回陣列
      mockPrisma.$transaction.mockResolvedValue([
        { ...mockBooking, status: 'cancelled' },
        { currentParticipants: 8 },
      ]);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/farm-tours/bookings/${bookingId}/cancel`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.message).toBe('預約已取消');
    });

    it('應該拒絕取消其他使用者的預約（回傳 400）', async () => {
      const bookingId = '550e8400-e29b-41d4-a716-446655440000';
      const mockBooking = createMockBooking({
        id: bookingId,
        userId: 'other-user',
        status: 'confirmed',
      });

      mockPrisma.farmTourBooking.findUnique.mockResolvedValue(mockBooking);

      // 注意：服務層使用 BadRequestException 而非 ForbiddenException
      await request(app.getHttpServer())
        .patch(`/api/v1/farm-tours/bookings/${bookingId}/cancel`)
        .set(authHeader('mock-jwt-token'))
        .expect(400);
    });
  });

  // ========================================
  // 管理員端點
  // ========================================

  describe('GET /admin/farm-tours', () => {
    it('應該返回所有農場導覽（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockTours = [
        createMockFarmTour({ id: 'tour-1', isActive: true }),
        createMockFarmTour({ id: 'tour-2', isActive: false }),
      ];

      mockPrisma.farmTour.findMany.mockResolvedValue(mockTours);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/farm-tours')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/farm-tours')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('POST /admin/farm-tours/draft', () => {
    it('應該建立草稿農場導覽', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockDraft = createMockFarmTour({
        id: 'draft-1',
        name: '未命名活動',
        isActive: false,
      });

      mockPrisma.farmTour.create.mockResolvedValue(mockDraft);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/farm-tours/draft')
        .set(authHeader('mock-jwt-token'))
        .expect(201);

      expect(response.body.name).toBe('未命名活動');
    });
  });

  describe('POST /admin/farm-tours', () => {
    it('應該建立新農場導覽', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const newTour = createMockFarmTour({
        id: 'new-tour',
        name: '秋季採茶',
      });

      mockPrisma.farmTour.create.mockResolvedValue(newTour);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/farm-tours')
        .set(authHeader('mock-jwt-token'))
        .send({
          name: '秋季採茶',
          description: '體驗秋季採茶',
          date: '2024-10-15',
          startTime: '09:00',
          endTime: '12:00',
          maxParticipants: 20,
          price: 1500,
          location: '竹山茶園',
        })
        .expect(201);

      expect(response.body.name).toBe('秋季採茶');
    });
  });

  describe('PUT /admin/farm-tours/:id', () => {
    it('應該更新農場導覽', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const tourId = '550e8400-e29b-41d4-a716-446655440000';
      const existingTour = createMockFarmTour({
        id: tourId,
        name: '舊名稱',
        bookings: [],
      });

      mockPrisma.farmTour.findUnique.mockResolvedValue(existingTour);
      mockPrisma.farmTour.update.mockResolvedValue({
        ...existingTour,
        name: '新名稱',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/farm-tours/${tourId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(200);

      expect(response.body.name).toBe('新名稱');
    });

    it('應該返回 404 當農場導覽不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.farmTour.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/admin/farm-tours/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(404);
    });
  });

  describe('DELETE /admin/farm-tours/:id', () => {
    it('應該刪除農場導覽', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const tourId = '550e8400-e29b-41d4-a716-446655440000';
      const existingTour = createMockFarmTour({ id: tourId, bookings: [] });

      mockPrisma.farmTour.findUnique.mockResolvedValue(existingTour);
      mockPrisma.farmTour.delete.mockResolvedValue(existingTour);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/farm-tours/${tourId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });
  });
});
