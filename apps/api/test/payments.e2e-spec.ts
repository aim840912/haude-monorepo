/**
 * 付款 E2E 測試
 *
 * 測試付款相關功能：
 * - 用戶端：建立付款請求、查詢付款狀態
 * - 管理員：查詢付款記錄、日誌、統計
 *
 * 注意：由於 PaymentsService 依賴 ECPay 配置，
 * 在測試環境中會拋出「支付功能尚未啟用」的錯誤，
 * 這是預期行為，用於驗證錯誤處理邏輯
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockOrder,
  createMockPayment,
  createMockPaymentLog,
} from './utils/test-helpers';

describe('Payments API (e2e)', () => {
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
  // 用戶端 API：建立付款請求
  // ========================================

  describe('POST /payments/create', () => {
    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/create')
        .send({ orderId: 'order-1', paymentMethod: 'CREDIT' })
        .expect(401);
    });

    it('應該驗證必要參數', async () => {
      // 缺少 orderId
      await request(app.getHttpServer())
        .post('/api/v1/payments/create')
        .set(authHeader('mock-jwt-token'))
        .send({})
        .expect(400);
    });

    it('應該返回錯誤當支付功能未啟用', async () => {
      // 在測試環境中 ECPay 配置不存在，會拋出 400 錯誤
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/create')
        .set(authHeader('mock-jwt-token'))
        .send({
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          paymentMethod: 'CREDIT',
        })
        .expect(400);

      expect(response.body.message).toContain('支付功能尚未啟用');
    });
  });

  // ========================================
  // 用戶端 API：查詢付款狀態
  // ========================================

  describe('GET /payments/:orderId/status', () => {
    it('應該返回付款狀態', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const mockOrder = createMockOrder({
        id: orderId,
        userId: 'user-123',
        paymentStatus: 'paid',
      });

      const mockPayment = createMockPayment({
        orderId,
        status: 'paid',
        tradeNo: 'ECPAY12345',
        payTime: new Date('2024-01-15T10:30:00'),
      });

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${orderId}/status`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
      expect(response.body.data.tradeNo).toBe('ECPAY12345');
    });

    it('應該返回 404 當訂單不存在', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/payments/nonexistent-order/status')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/payments/order-1/status')
        .expect(401);
    });
  });

  // ========================================
  // 綠界 Webhook 端點
  // ========================================

  describe('POST /payments/ecpay/notify', () => {
    it('應該接受 POST 請求（不需認證）', async () => {
      // Webhook 不需要 JWT 認證，但需要 CheckMacValue 驗證
      // 在測試環境中 ECPay 未啟用，會返回錯誤
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/ecpay/notify')
        .send({
          MerchantTradeNo: 'HAU20240115001',
          RtnCode: '1',
          CheckMacValue: 'MOCK_MAC_VALUE',
        })
        .expect(400);

      expect(response.body.message).toContain('支付功能尚未啟用');
    });
  });

  describe('POST /payments/ecpay/info', () => {
    it('應該接受取號通知（不需認證）', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/ecpay/info')
        .send({
          MerchantTradeNo: 'HAU20240115001',
          RtnCode: '2',
          BankCode: '007',
          vAccount: '1234567890123456',
        })
        .expect(400);

      expect(response.body.message).toContain('支付功能尚未啟用');
    });
  });

  describe('POST /payments/ecpay/return', () => {
    it('應該接受返回頁請求（不需認證）', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/ecpay/return')
        .send({
          MerchantTradeNo: 'HAU20240115001',
          RtnCode: '1',
        })
        .expect(400);

      expect(response.body.message).toContain('支付功能尚未啟用');
    });
  });

  // ========================================
  // 管理員 API：取得所有付款記錄
  // ========================================

  describe('GET /admin/payments', () => {
    it('應該返回付款記錄列表（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockPayments = [
        createMockPayment({
          id: 'payment-1',
          status: 'paid',
          order: {
            orderNumber: 'ORD-001',
            user: { name: '測試', email: 'test@example.com' },
          },
        }),
        createMockPayment({
          id: 'payment-2',
          status: 'pending',
          order: {
            orderNumber: 'ORD-002',
            user: { name: '測試2', email: 'test2@example.com' },
          },
        }),
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.total).toBe(2);
    });

    it('應該支援分頁參數', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.payment.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .query({ limit: 10, offset: 20 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(20);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該允許 STAFF 存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.payment.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });
  });

  // ========================================
  // 管理員 API：取得付款日誌
  // ========================================

  describe('GET /admin/payments/logs', () => {
    it('應該返回付款日誌列表（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockLogs = [
        createMockPaymentLog({
          id: 'log-1',
          logType: 'notify',
          verified: true,
        }),
        createMockPaymentLog({
          id: 'log-2',
          logType: 'return',
          verified: true,
        }),
      ];

      mockPrisma.paymentLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.paymentLog.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments/logs')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.total).toBe(2);
    });

    it('應該支援分頁參數', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.paymentLog.findMany.mockResolvedValue([]);
      mockPrisma.paymentLog.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments/logs')
        .query({ limit: 25, offset: 50 })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.limit).toBe(25);
      expect(response.body.offset).toBe(50);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/payments/logs')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員 API：取得付款統計
  // ========================================

  describe('GET /admin/payments/stats', () => {
    it('應該返回付款統計（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.payment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // paid
        .mockResolvedValueOnce(15) // pending
        .mockResolvedValueOnce(5); // failed

      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 500000 },
      });

      mockPrisma.paymentLog.count.mockResolvedValue(3);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments/stats')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.totalPayments).toBe(100);
      expect(response.body.paidPayments).toBe(80);
      expect(response.body.pendingPayments).toBe(15);
      expect(response.body.failedPayments).toBe(5);
      expect(response.body.totalAmount).toBe(500000);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/payments/stats')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });
});
