/**
 * 折扣碼 E2E 測試
 *
 * 測試折扣碼完整功能：
 * - 用戶端：驗證折扣碼
 * - 管理員：CRUD 操作
 *
 * 注意：由於 DiscountsService 被 mock，測試直接配置 mockDiscounts
 */

import {
  INestApplication,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockDiscountsService,
  createMockUser,
  createMockDiscountCode,
} from './utils/test-helpers';

describe('Discounts API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockDiscounts: ReturnType<typeof createMockDiscountsService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;
    mockDiscounts = testApp.mockDiscounts;

    // 預設 mock：用戶存在（用於 JWT 驗證）
    const mockUser = createMockUser({ id: 'user-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 用戶端 API：驗證折扣碼
  // ========================================

  describe('GET /discounts/:code/validate', () => {
    it('應該成功驗證有效的折扣碼', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: true,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        code: 'TEST10',
        description: '測試折扣碼',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/TEST10/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.discountAmount).toBe(100);
      expect(response.body.code).toBe('TEST10');
    });

    it('應該返回無效當折扣碼不存在', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '折扣碼不存在',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/INVALID/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('不存在');
    });

    it('應該返回無效當折扣碼已停用', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '此折扣碼已停用',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/INACTIVE/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('停用');
    });

    it('應該返回無效當折扣碼已過期', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '此折扣碼已過期',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/EXPIRED/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('過期');
    });

    it('應該返回無效當訂單金額不足', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '訂單金額需滿 NT$1000 才能使用此折扣碼',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/MIN1000/validate')
        .query({ subtotal: '500' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('訂單金額需滿');
    });

    it('應該返回無效當用戶已達使用次數上限', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: false,
        message: '您已達此折扣碼的使用次數上限',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/ONEUSE/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('使用次數上限');
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/discounts/TEST10/validate')
        .query({ subtotal: '1000' })
        .expect(401);
    });

    it('應該計算固定金額折扣', async () => {
      mockDiscounts.validateDiscountCode.mockResolvedValue({
        valid: true,
        discountType: 'FIXED',
        discountValue: 100,
        discountAmount: 100,
        code: 'FIXED100',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/discounts/FIXED100/validate')
        .query({ subtotal: '1000' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.discountAmount).toBe(100);
    });
  });

  // ========================================
  // 管理員 API：取得所有折扣碼
  // ========================================

  describe('GET /admin/discounts', () => {
    it('應該返回所有折扣碼（管理員）', async () => {
      // 設定管理員用戶
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockDiscountsList = [
        createMockDiscountCode({ id: 'discount-1', code: 'TEST10' }),
        createMockDiscountCode({ id: 'discount-2', code: 'SUMMER20' }),
      ];

      mockDiscounts.findAll.mockResolvedValue(mockDiscountsList);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/discounts')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('應該支援 isActive 篩選', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockDiscounts.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/discounts')
        .query({ isActive: 'true' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(mockDiscounts.findAll).toHaveBeenCalled();
    });

    it('應該拒絕非管理員的請求', async () => {
      // 普通用戶
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/discounts')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員 API：取得單一折扣碼
  // ========================================

  describe('GET /admin/discounts/:id', () => {
    it('應該返回折扣碼詳情', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const discountId = '550e8400-e29b-41d4-a716-446655440000';
      const mockDiscount = createMockDiscountCode({
        id: discountId,
        code: 'DETAIL10',
      });

      mockDiscounts.findById.mockResolvedValue(mockDiscount);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/discounts/${discountId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.id).toBe(discountId);
      expect(response.body.code).toBe('DETAIL10');
    });

    it('應該返回 404 當折扣碼不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockDiscounts.findById.mockRejectedValue(
        new NotFoundException('找不到此折扣碼'),
      );

      await request(app.getHttpServer())
        .get('/api/v1/admin/discounts/nonexistent-id')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });
  });

  // ========================================
  // 管理員 API：建立折扣碼
  // ========================================

  describe('POST /admin/discounts', () => {
    it('應該成功建立折扣碼', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const createDto = {
        code: 'NEWYEAR',
        discountType: 'PERCENTAGE' as const,
        discountValue: 15,
        description: '新年優惠',
      };

      mockDiscounts.create.mockResolvedValue(
        createMockDiscountCode({
          id: 'new-discount',
          ...createDto,
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/discounts')
        .set(authHeader('mock-jwt-token'))
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('NEWYEAR');
    });

    it('應該拒絕重複的折扣碼', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const createDto = {
        code: 'EXISTING',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      };

      mockDiscounts.create.mockRejectedValue(
        new ConflictException('此折扣碼已存在'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/admin/discounts')
        .set(authHeader('mock-jwt-token'))
        .send(createDto)
        .expect(409);
    });

    it('應該驗證必要欄位', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      await request(app.getHttpServer())
        .post('/api/v1/admin/discounts')
        .set(authHeader('mock-jwt-token'))
        .send({}) // 缺少必要欄位
        .expect(400);
    });
  });

  // ========================================
  // 管理員 API：更新折扣碼
  // ========================================

  describe('PUT /admin/discounts/:id', () => {
    it('應該成功更新折扣碼', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const discountId = '550e8400-e29b-41d4-a716-446655440000';
      const existingDiscount = createMockDiscountCode({ id: discountId });

      mockDiscounts.update.mockResolvedValue({
        ...existingDiscount,
        discountValue: 20,
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/discounts/${discountId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ discountValue: 20 })
        .expect(200);

      expect(response.body.discountValue).toBe(20);
    });

    it('應該返回 404 當折扣碼不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockDiscounts.update.mockRejectedValue(
        new NotFoundException('找不到此折扣碼'),
      );

      await request(app.getHttpServer())
        .put('/api/v1/admin/discounts/nonexistent-id')
        .set(authHeader('mock-jwt-token'))
        .send({ discountValue: 20 })
        .expect(404);
    });
  });

  // ========================================
  // 管理員 API：刪除折扣碼
  // ========================================

  describe('DELETE /admin/discounts/:id', () => {
    it('應該成功刪除未使用的折扣碼', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const discountId = '550e8400-e29b-41d4-a716-446655440000';
      const existingDiscount = createMockDiscountCode({
        id: discountId,
        _count: { usages: 0 },
      });

      mockDiscounts.delete.mockResolvedValue(existingDiscount);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/discounts/${discountId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該停用已使用過的折扣碼而非刪除', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const discountId = '550e8400-e29b-41d4-a716-446655440000';
      const existingDiscount = createMockDiscountCode({
        id: discountId,
        isActive: false,
        _count: { usages: 5 },
      });

      // 如果有使用記錄，delete 方法會返回停用後的折扣碼
      mockDiscounts.delete.mockResolvedValue(existingDiscount);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/discounts/${discountId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(mockDiscounts.delete).toHaveBeenCalled();
    });

    it('應該返回 404 當折扣碼不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockDiscounts.delete.mockRejectedValue(
        new NotFoundException('找不到此折扣碼'),
      );

      await request(app.getHttpServer())
        .delete('/api/v1/admin/discounts/nonexistent-id')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });
  });
});
