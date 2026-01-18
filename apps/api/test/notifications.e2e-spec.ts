/**
 * 通知 API E2E 測試
 *
 * 測試功能：
 * - 通知列表、未讀數量
 * - 標記已讀、全部已讀
 * - 刪除通知
 * - 庫存預警設定
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockNotification,
  createMockStockAlertSetting,
} from './utils/test-helpers';

describe('Notifications API (e2e)', () => {
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
  // 通知列表
  // ========================================

  describe('GET /admin/notifications', () => {
    it('應該返回通知列表（ADMIN）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockNotifications = [
        createMockNotification({ id: 'notif-1', title: '新訂單' }),
        createMockNotification({ id: 'notif-2', title: '庫存預警' }),
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該支援 STAFF 角色存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該支援只顯示未讀通知', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .set(authHeader('mock-jwt-token'))
        .query({ unreadOnly: 'true' })
        .expect(200);
    });

    it('應該支援分頁', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(100);

      await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .set(authHeader('mock-jwt-token'))
        .query({ limit: '10', offset: '20' })
        .expect(200);
    });

    it('應該拒絕非管理員/員工的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/notifications')
        .expect(401);
    });
  });

  // ========================================
  // 未讀數量
  // ========================================

  describe('GET /admin/notifications/unread-count', () => {
    it('應該返回未讀通知數量', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.count.mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/notifications/unread-count')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.count).toBe(5);
    });

    it('應該返回 0 當沒有未讀通知', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/notifications/unread-count')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.count).toBe(0);
    });
  });

  // ========================================
  // 標記已讀
  // ========================================

  describe('PATCH /admin/notifications/:id/read', () => {
    it('應該標記通知為已讀', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const notificationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockNotification = createMockNotification({
        id: notificationId,
        isRead: false,
      });

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/notifications/${notificationId}/read`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.isRead).toBe(true);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/notifications/550e8400-e29b-41d4-a716-446655440000/read')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 全部標記已讀
  // ========================================

  describe('PATCH /admin/notifications/read-all', () => {
    it('應該標記所有通知為已讀', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.updateMany.mockResolvedValue({ count: 10 });

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/notifications/read-all')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.updated).toBe(10);
    });

    it('應該返回 0 當沒有未讀通知', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/notifications/read-all')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.updated).toBe(0);
    });
  });

  // ========================================
  // 刪除通知
  // ========================================

  describe('DELETE /admin/notifications/:id', () => {
    it('應該刪除通知', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const notificationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockNotification = createMockNotification({ id: notificationId });

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/notifications/${notificationId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/notifications/550e8400-e29b-41d4-a716-446655440000')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 庫存預警設定
  // ========================================

  describe('GET /admin/stock-alerts', () => {
    it('應該返回庫存預警設定列表', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockSettings = [
        createMockStockAlertSetting({ productId: 'prod-1', threshold: 10 }),
        createMockStockAlertSetting({ productId: 'prod-2', threshold: 5 }),
      ];

      mockPrisma.stockAlertSetting.findMany.mockResolvedValue(mockSettings);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/stock-alerts')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/stock-alerts')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('PATCH /admin/stock-alerts/:productId', () => {
    it('應該更新庫存預警設定', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const mockSetting = createMockStockAlertSetting({
        productId,
        threshold: 15,
        isEnabled: true,
      });

      mockPrisma.stockAlertSetting.upsert.mockResolvedValue(mockSetting);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/stock-alerts/${productId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ threshold: 15, isEnabled: true })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/stock-alerts/550e8400-e29b-41d4-a716-446655440000')
        .set(authHeader('mock-jwt-token'))
        .send({ threshold: 10 })
        .expect(403);
    });
  });
});
