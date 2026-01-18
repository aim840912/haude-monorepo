/**
 * 訂單流程 E2E 測試
 *
 * 測試訂單完整生命週期：
 * - 建立訂單
 * - 取得訂單列表
 * - 取得訂單詳情
 * - 取消訂單
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockProduct,
  createMockOrder,
  createMockCreateOrderDto,
} from './utils/test-helpers';

describe('Orders API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;

    // 預設 mock：用戶存在（用於 JWT 驗證）
    const mockUser = createMockUser({ id: 'user-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 取得訂單列表測試
  // ========================================

  describe('GET /orders', () => {
    it('應該返回用戶的訂單列表', async () => {
      const mockOrders = [
        createMockOrder({
          id: 'order-1',
          userId: 'user-123',
          orderNumber: 'ORD-001',
        }),
        createMockOrder({
          id: 'order-2',
          userId: 'user-123',
          orderNumber: 'ORD-002',
        }),
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
    });

    it('應該支援分頁參數', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ limit: 5, offset: 0 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveProperty('orders');
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
    });
  });

  // ========================================
  // 建立訂單測試
  // ========================================

  describe('POST /orders', () => {
    it('應該成功建立訂單', async () => {
      const createOrderDto = createMockCreateOrderDto({
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 },
        ],
      });

      const mockProduct = createMockProduct({
        id: '550e8400-e29b-41d4-a716-446655440000',
        price: 500,
        stock: 100,
        reservedStock: 0,
      });

      const mockOrder = createMockOrder({
        id: 'order-new',
        userId: 'user-123',
        totalAmount: 1060,
      });

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ id: 'user-123' }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader('mock-jwt-token'))
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
    });

    it('應該驗證訂單項目必須存在', async () => {
      const invalidDto = {
        items: [],
        shippingAddress: {
          name: '測試收件人',
          phone: '0912345678',
          city: '台北市',
          street: '測試路',
          postalCode: '100',
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader('mock-jwt-token'))
        .send(invalidDto)
        .expect(400);
    });

    it('應該驗證配送地址完整性', async () => {
      const invalidDto = {
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 },
        ],
        shippingAddress: {
          name: '測試收件人',
          // 缺少其他必要欄位
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader('mock-jwt-token'))
        .send(invalidDto)
        .expect(400);
    });
  });

  // ========================================
  // 取得訂單詳情測試
  // ========================================

  describe('GET /orders/:id', () => {
    it('應該返回訂單詳情', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const mockOrder = createMockOrder({
        id: orderId,
        userId: 'user-123',
        orderNumber: 'ORD-001',
      });

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('items');
    });

    it('應該返回 404 當訂單不存在', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該驗證 UUID 格式', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/invalid-uuid')
        .set(authHeader('mock-jwt-token'))
        .expect(400);
    });
  });

  // ========================================
  // 取消訂單測試
  // ========================================

  describe('PATCH /orders/:id/cancel', () => {
    it('應該成功取消待處理訂單', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const pendingOrder = createMockOrder({
        id: orderId,
        userId: 'user-123',
        status: 'pending',
      });

      const cancelledOrder = createMockOrder({
        ...pendingOrder,
        status: 'cancelled',
      });

      mockPrisma.order.findFirst.mockResolvedValue(pendingOrder);
      mockPrisma.order.update.mockResolvedValue(cancelledOrder);
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader('mock-jwt-token'))
        .send({ reason: '我不想要了' })
        .expect(200);

      // cancelOrder 返回 { message: '訂單已取消' } 而非訂單對象
      expect(response.body.message).toContain('已取消');
    });

    it('應該拒絕取消已處理的訂單', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const shippedOrder = createMockOrder({
        id: orderId,
        userId: 'user-123',
        status: 'shipped',
      });

      mockPrisma.order.findFirst.mockResolvedValue(shippedOrder);

      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader('mock-jwt-token'))
        .send({ reason: '我不想要了' })
        .expect(400);
    });

    it('應該返回 404 當訂單不存在', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader('mock-jwt-token'))
        .send({ reason: '取消原因' })
        .expect(404);
    });
  });
});
