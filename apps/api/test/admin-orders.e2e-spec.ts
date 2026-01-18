/**
 * 管理員訂單 E2E 測試
 *
 * 測試管理員訂單管理功能：
 * - 訂單列表、訂單詳情、訂單統計
 * - 更新訂單狀態
 * - 儀表板統計（營收趨勢、訂單狀態分布、熱銷產品）
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

describe('Admin Orders API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;

    // 預設 mock：管理員用戶
    const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 管理員訂單 API
  // ========================================

  describe('GET /admin/orders', () => {
    it('應該返回所有訂單列表（管理員）', async () => {
      const mockOrders = [
        {
          ...createMockOrder({
            id: 'order-1',
            orderNumber: 'ORD-001',
            status: 'pending',
          }),
          user: {
            id: 'user-1',
            name: '測試使用者',
            email: 'test1@example.com',
          },
        },
        {
          ...createMockOrder({
            id: 'order-2',
            orderNumber: 'ORD-002',
            status: 'shipped',
          }),
          user: {
            id: 'user-2',
            name: '測試使用者2',
            email: 'test2@example.com',
          },
        },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      // getAllOrders 返回 { orders, total, limit, offset, hasMore }
      expect(response.body.orders).toBeDefined();
      expect(response.body.total).toBe(2);
    });

    it('應該支援分頁參數', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .query({ limit: 10, offset: 20 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(20);
    });

    it('應該允許 STAFF 存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('GET /admin/orders/stats', () => {
    it('應該返回訂單統計', async () => {
      // getOrderStats 使用 count, aggregate, groupBy
      mockPrisma.order.count.mockResolvedValue(100);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500000 },
      });
      // groupBy 需要返回陣列格式
      mockPrisma.order.groupBy.mockResolvedValue([
        { status: 'pending', _count: { status: 20 } },
        { status: 'processing', _count: { status: 10 } },
        { status: 'shipped', _count: { status: 50 } },
        { status: 'delivered', _count: { status: 15 } },
        { status: 'cancelled', _count: { status: 5 } },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders/stats')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.totalOrders).toBe(100);
      expect(response.body.totalAmount).toBe(500000);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders/stats')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('GET /admin/orders/:id', () => {
    it('應該返回訂單詳情', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const mockOrder = createMockOrder({
        id: orderId,
        orderNumber: 'ORD-DETAIL-001',
        status: 'shipped',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productName: '測試產品',
            quantity: 2,
            unitPrice: 500,
            subtotal: 1000,
          },
        ],
      });

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.orderNumber).toBe('ORD-DETAIL-001');
    });

    it('應該返回 404 當訂單不存在', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('PATCH /admin/orders/:id', () => {
    it('應該成功更新訂單狀態為處理中', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const existingOrder = {
        ...createMockOrder({
          id: orderId,
          status: 'pending',
        }),
        user: { email: 'test@example.com', name: '測試使用者' },
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...existingOrder,
        status: 'processing',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.status).toBe('processing');
    });

    it('應該成功更新訂單狀態為已出貨', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const existingOrder = {
        ...createMockOrder({
          id: orderId,
          status: 'processing',
        }),
        user: { email: 'test@example.com', name: '測試使用者' },
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...existingOrder,
        status: 'shipped',
        trackingNumber: 'TRACK123456',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ status: 'shipped', trackingNumber: 'TRACK123456' })
        .expect(200);

      expect(response.body.status).toBe('shipped');
      expect(response.body.trackingNumber).toBe('TRACK123456');
    });

    it('應該成功更新訂單狀態為已送達', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const existingOrder = {
        ...createMockOrder({
          id: orderId,
          status: 'shipped',
        }),
        user: { email: 'test@example.com', name: '測試使用者' },
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...existingOrder,
        status: 'delivered',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ status: 'delivered' })
        .expect(200);

      expect(response.body.status).toBe('delivered');
    });

    it('應該返回 404 當訂單不存在', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .send({ status: 'processing' })
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000')
        .set(authHeader('mock-jwt-token'))
        .send({ status: 'processing' })
        .expect(403);
    });
  });

  // ========================================
  // 儀表板 API
  // ========================================

  describe('GET /admin/dashboard/revenue-trend', () => {
    it('應該返回每日營收趨勢', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([
        { createdAt: new Date('2024-01-15'), _sum: { totalAmount: 10000 } },
        { createdAt: new Date('2024-01-16'), _sum: { totalAmount: 15000 } },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/revenue-trend')
        .query({ period: 'day' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該返回每週營收趨勢', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/revenue-trend')
        .query({ period: 'week' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該返回每月營收趨勢', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/revenue-trend')
        .query({ period: 'month' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/revenue-trend')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('GET /admin/dashboard/order-status', () => {
    it('應該返回訂單狀態分布', async () => {
      mockPrisma.order.groupBy.mockResolvedValue([
        { status: 'pending', _count: { id: 20 } },
        { status: 'processing', _count: { id: 10 } },
        { status: 'shipped', _count: { id: 50 } },
        { status: 'delivered', _count: { id: 100 } },
        { status: 'cancelled', _count: { id: 5 } },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/order-status')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/order-status')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('GET /admin/dashboard/top-products', () => {
    it('應該返回熱銷產品', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        {
          productId: 'product-1',
          _sum: { quantity: 100 },
        },
        {
          productId: 'product-2',
          _sum: { quantity: 80 },
        },
      ]);

      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', name: '熱銷產品 1' },
        { id: 'product-2', name: '熱銷產品 2' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/top-products')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('應該支援 limit 參數', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/top-products')
        .query({ limit: 5 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard/top-products')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });
});
