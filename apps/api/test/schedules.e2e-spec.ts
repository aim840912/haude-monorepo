/**
 * 活動排程 E2E 測試
 *
 * 測試功能：
 * - 公開端點：列表、詳情、即將到來、按月份查詢
 * - 管理員端點：CRUD 操作
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockSchedule,
} from './utils/test-helpers';

describe('Schedules API (e2e)', () => {
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

  describe('GET /schedules', () => {
    it('應該返回所有啟用的活動排程', async () => {
      const mockSchedules = [
        createMockSchedule({ id: 'sch-1', title: '春茶上市' }),
        createMockSchedule({ id: 'sch-2', title: '冬茶上市' }),
      ];

      mockPrisma.schedule.findMany.mockResolvedValue(mockSchedules);

      const response = await request(app.getHttpServer())
        .get('/api/v1/schedules')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('春茶上市');
    });

    it('應該返回空陣列當沒有活動排程', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/schedules')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /schedules/upcoming', () => {
    it('應該返回即將到來的活動排程', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockSchedules = [
        createMockSchedule({
          id: 'sch-1',
          title: '下週活動',
          date: futureDate,
        }),
      ];

      mockPrisma.schedule.findMany.mockResolvedValue(mockSchedules);

      const response = await request(app.getHttpServer())
        .get('/api/v1/schedules/upcoming')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /schedules/month', () => {
    it('應該返回指定月份的活動排程', async () => {
      const mockSchedules = [
        createMockSchedule({
          id: 'sch-1',
          title: '四月活動',
          date: new Date('2024-04-15'),
        }),
      ];

      mockPrisma.schedule.findMany.mockResolvedValue(mockSchedules);

      const response = await request(app.getHttpServer())
        .get('/api/v1/schedules/month')
        .query({ year: '2024', month: '4' })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /schedules/:id', () => {
    it('應該返回活動排程詳情', async () => {
      const scheduleId = '550e8400-e29b-41d4-a716-446655440000';
      const mockSchedule = createMockSchedule({
        id: scheduleId,
        title: '特別活動',
        location: '總店',
      });

      mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/schedules/${scheduleId}`)
        .expect(200);

      expect(response.body.id).toBe(scheduleId);
      expect(response.body.title).toBe('特別活動');
    });

    it('應該返回 404 當活動排程不存在', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/schedules/550e8400-e29b-41d4-a716-446655440001')
        .expect(404);
    });
  });

  // ========================================
  // 管理員端點
  // ========================================

  describe('GET /admin/schedules', () => {
    it('應該返回所有活動排程（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockSchedules = [
        createMockSchedule({ id: 'sch-1', isActive: true }),
        createMockSchedule({ id: 'sch-2', isActive: false }),
      ];

      mockPrisma.schedule.findMany.mockResolvedValue(mockSchedules);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/schedules')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('應該允許 STAFF 存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.schedule.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/schedules')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/schedules')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('POST /admin/schedules', () => {
    it('應該建立新活動排程', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const newSchedule = createMockSchedule({
        id: 'new-sch',
        title: '年度大促銷',
        location: '全門市',
      });

      mockPrisma.schedule.create.mockResolvedValue(newSchedule);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schedules')
        .set(authHeader('mock-jwt-token'))
        .send({
          title: '年度大促銷',
          location: '全門市',
          date: '2024-12-01',
          time: '09:00',
          description: '年度最大優惠活動',
        })
        .expect(201);

      expect(response.body.title).toBe('年度大促銷');
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/schedules')
        .set(authHeader('mock-jwt-token'))
        .send({
          title: '測試活動',
          location: '總店',
          date: '2024-12-01',
          time: '09:00',
        })
        .expect(403);
    });
  });

  describe('PUT /admin/schedules/:id', () => {
    it('應該更新活動排程', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const scheduleId = '550e8400-e29b-41d4-a716-446655440000';
      const existingSchedule = createMockSchedule({
        id: scheduleId,
        title: '舊標題',
      });

      mockPrisma.schedule.findUnique.mockResolvedValue(existingSchedule);
      mockPrisma.schedule.update.mockResolvedValue({
        ...existingSchedule,
        title: '新標題',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/schedules/${scheduleId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ title: '新標題' })
        .expect(200);

      expect(response.body.title).toBe('新標題');
    });

    it('應該返回 404 當活動排程不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/admin/schedules/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .send({ title: '新標題' })
        .expect(404);
    });
  });

  describe('DELETE /admin/schedules/:id', () => {
    it('應該刪除活動排程', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const scheduleId = '550e8400-e29b-41d4-a716-446655440000';
      const existingSchedule = createMockSchedule({ id: scheduleId });

      mockPrisma.schedule.findUnique.mockResolvedValue(existingSchedule);
      mockPrisma.schedule.delete.mockResolvedValue(existingSchedule);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/schedules/${scheduleId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該返回 404 當活動排程不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/admin/schedules/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/schedules/550e8400-e29b-41d4-a716-446655440000')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 邊界情況
  // ========================================

  describe('邊界情況', () => {
    it('應該處理無效的 UUID（服務層返回 404）', async () => {
      // 注意：此路由未使用 ParseUUIDPipe，所以無效 UUID 會被視為不存在的 ID
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/schedules/invalid-uuid')
        .expect(404);
    });

    it('應該處理空的更新請求', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const scheduleId = '550e8400-e29b-41d4-a716-446655440000';
      const existingSchedule = createMockSchedule({ id: scheduleId });

      mockPrisma.schedule.findUnique.mockResolvedValue(existingSchedule);
      mockPrisma.schedule.update.mockResolvedValue(existingSchedule);

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/schedules/${scheduleId}`)
        .set(authHeader('mock-jwt-token'))
        .send({})
        .expect(200);

      expect(response.body.id).toBe(scheduleId);
    });
  });
});
