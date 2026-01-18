/**
 * 報表 API E2E 測試
 *
 * 測試功能：
 * - 銷售摘要報表
 * - 銷售趨勢報表
 * - 銷售明細報表
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockOrder,
} from './utils/test-helpers';

describe('Reports API (e2e)', () => {
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
  // 銷售摘要報表
  // ========================================

  describe('GET /admin/reports/summary', () => {
    it('應該返回銷售摘要（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      // Mock 訂單統計 - aggregate 格式必須符合 Prisma 回傳結構
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
        _count: { id: 25 },
      });
      mockPrisma.order.count.mockResolvedValue(0); // 取消的訂單數

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .set(authHeader('mock-jwt-token'))
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.current).toBeDefined();
    });

    it('應該支援 STAFF 角色存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _count: { id: 10 },
      });
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .set(authHeader('mock-jwt-token'))
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);
    });

    it('應該支援年同比對比模式', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
        _count: { id: 25 },
      });
      mockPrisma.order.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .set(authHeader('mock-jwt-token'))
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          compareMode: 'yoy',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(401);
    });

    // 注意：ReportsController 只使用 JwtAuthGuard，沒有角色限制
    // 任何已認證的用戶都可以存取報表
    it('應該允許一般用戶存取報表（無角色限制）', async () => {
      // 預設 mock 是一般用戶
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 5000 },
        _count: { id: 5 },
      });
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .set(authHeader('mock-jwt-token'))
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);
    });

    it('應該返回 400 當缺少日期參數', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/summary')
        .set(authHeader('mock-jwt-token'))
        .expect(400);
    });
  });

  // ========================================
  // 銷售趨勢報表
  // ========================================

  describe('GET /admin/reports/sales-trend', () => {
    it('應該返回銷售趨勢（按日）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.order.groupBy.mockResolvedValue([
        { createdAt: new Date('2024-01-01'), _sum: { totalAmount: 5000 } },
        { createdAt: new Date('2024-01-02'), _sum: { totalAmount: 8000 } },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-trend')
        .set(authHeader('mock-jwt-token'))
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy: 'day',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該支援按週分組', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.order.groupBy.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-trend')
        .set(authHeader('mock-jwt-token'))
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy: 'week',
        })
        .expect(200);
    });

    it('應該支援按月分組', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.order.groupBy.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-trend')
        .set(authHeader('mock-jwt-token'))
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          groupBy: 'month',
        })
        .expect(200);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-trend')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(401);
    });
  });

  // ========================================
  // 銷售明細報表
  // ========================================

  describe('GET /admin/reports/sales-detail', () => {
    it('應該返回銷售明細（分頁）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockOrders = [
        createMockOrder({ id: 'order-1', totalAmount: 1500 }),
        createMockOrder({ id: 'order-2', totalAmount: 2500 }),
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(50);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-detail')
        .set(authHeader('mock-jwt-token'))
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該支援自訂分頁參數', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-detail')
        .set(authHeader('mock-jwt-token'))
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          limit: '10',
          offset: '20',
        })
        .expect(200);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/reports/sales-detail')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(401);
    });
  });
});
