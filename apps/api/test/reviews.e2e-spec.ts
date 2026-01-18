/**
 * 評論 E2E 測試
 *
 * 測試評論完整功能：
 * - 公開端點：取得產品評論、評分統計
 * - 需認證端點：新增、更新、刪除評論
 * - 管理員端點：審核評論、刪除評論
 */

import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockReview,
  createMockProduct,
} from './utils/test-helpers';

describe('Reviews API (e2e)', () => {
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
  // 公開端點：取得產品評論
  // ========================================

  describe('GET /products/:productId/reviews', () => {
    it('應該返回產品評論列表', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const mockReviews = [
        createMockReview({ id: 'review-1', rating: 5, user: { id: 'user-1', name: '測試使用者', avatar: null } }),
        createMockReview({ id: 'review-2', rating: 4, user: { id: 'user-2', name: '測試使用者2', avatar: null } }),
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews`)
        .expect(200);

      // ReviewsService.getProductReviews 返回 { reviews, total, hasMore }
      expect(response.body.reviews).toBeDefined();
      expect(response.body.total).toBe(2);
    });

    it('應該支援分頁參數', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews`)
        .query({ limit: 5, offset: 10 })
        .expect(200);
    });
  });

  describe('GET /products/:productId/reviews/stats', () => {
    it('應該返回評分統計', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      // ReviewsService.getReviewStats 會先檢查產品是否存在
      mockPrisma.product.findUnique.mockResolvedValue(
        createMockProduct({ id: productId }),
      );

      // 然後取得評論來計算統計
      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews/stats`)
        .expect(200);

      expect(response.body.averageRating).toBeDefined();
      expect(response.body.totalReviews).toBe(3);
    });

    it('應該返回 404 當產品不存在', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews/stats`)
        .expect(404);
    });
  });

  // ========================================
  // 需認證端點：評論資格檢查
  // ========================================

  describe('GET /products/:productId/reviews/check-eligibility', () => {
    it('應該返回評論資格（可評論）', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      // Mock: 用戶已購買且已送達
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        status: 'delivered',
      });
      // Mock: 用戶尚未評論
      mockPrisma.review.findFirst.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews/check-eligibility`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.canReview).toBeDefined();
    });

    it('應該拒絕未認證的請求', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews/check-eligibility`)
        .expect(401);
    });
  });

  // ========================================
  // 需認證端點：新增評論
  // ========================================

  describe('POST /products/:productId/reviews', () => {
    it('應該成功建立評論', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const createDto = {
        rating: 5,
        title: '很棒的產品',
        content: '品質很好，推薦購買！',
      };

      // Mock: 產品存在
      mockPrisma.product.findUnique.mockResolvedValue(
        createMockProduct({ id: productId }),
      );
      // Mock: 尚未評論（findUnique 用於複合鍵查詢）
      mockPrisma.review.findUnique.mockResolvedValue(null);
      // Mock: 用戶已購買且已送達（checkPurchaseHistory）
      mockPrisma.order.findFirst
        .mockResolvedValueOnce({ id: 'order-1', status: 'delivered' }); // delivered 訂單
      // Mock: 建立成功
      mockPrisma.review.create.mockResolvedValue(
        createMockReview({
          id: 'new-review',
          ...createDto,
          user: { id: 'user-123', name: '測試使用者', avatar: null },
        }),
      );

      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set(authHeader('mock-jwt-token'))
        .send(createDto)
        .expect(201);

      expect(response.body.rating).toBe(5);
    });

    it('應該驗證必要欄位', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set(authHeader('mock-jwt-token'))
        .send({}) // 缺少 rating
        .expect(400);
    });

    it('應該拒絕未認證的請求', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .send({ rating: 5 })
        .expect(401);
    });
  });

  // ========================================
  // 需認證端點：更新評論
  // ========================================

  describe('PUT /reviews/:id', () => {
    it('應該成功更新自己的評論', async () => {
      const reviewId = '550e8400-e29b-41d4-a716-446655440000';
      const existingReview = createMockReview({
        id: reviewId,
        userId: 'user-123',
        user: { id: 'user-123', name: '測試使用者', avatar: null },
        product: { id: 'product-1', name: '測試產品' },
      });

      // findById 會使用 findUnique
      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.update.mockResolvedValue({
        ...existingReview,
        rating: 4,
        content: '更新後的評論',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/reviews/${reviewId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ rating: 4, content: '更新後的評論' })
        .expect(200);

      expect(response.body.rating).toBe(4);
    });

    it('應該返回 404 當評論不存在', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/reviews/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .send({ rating: 4 })
        .expect(404);
    });
  });

  // ========================================
  // 需認證端點：刪除評論
  // ========================================

  describe('DELETE /reviews/:id', () => {
    it('應該成功刪除自己的評論', async () => {
      const reviewId = '550e8400-e29b-41d4-a716-446655440000';
      const existingReview = createMockReview({
        id: reviewId,
        userId: 'user-123',
        user: { id: 'user-123', name: '測試使用者', avatar: null },
        product: { id: 'product-1', name: '測試產品' },
      });

      // findById 使用 findUnique
      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.delete.mockResolvedValue(existingReview);

      await request(app.getHttpServer())
        .delete(`/api/v1/reviews/${reviewId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該返回 404 當評論不存在', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/reviews/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });
  });

  // ========================================
  // 管理員端點：取得所有評論
  // ========================================

  describe('GET /admin/reviews', () => {
    it('應該返回所有評論（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockReviews = [
        createMockReview({
          id: 'review-1',
          isApproved: true,
          user: { id: 'user-1', name: '測試使用者', avatar: null },
          product: { id: 'product-1', name: '測試產品' },
        }),
        createMockReview({
          id: 'review-2',
          isApproved: false,
          user: { id: 'user-2', name: '測試使用者2', avatar: null },
          product: { id: 'product-2', name: '測試產品2' },
        }),
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      // findAll 返回 { reviews, total }
      expect(response.body.reviews).toBeDefined();
      expect(response.body.total).toBe(2);
    });

    it('應該支援 isApproved 篩選', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .query({ isApproved: 'false' })
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該允許 STAFF 存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：審核評論
  // ========================================

  describe('PATCH /admin/reviews/:id/approve', () => {
    it('應該成功審核評論（核准）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const reviewId = '550e8400-e29b-41d4-a716-446655440000';
      const existingReview = createMockReview({
        id: reviewId,
        isApproved: false,
      });

      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.update.mockResolvedValue({
        ...existingReview,
        isApproved: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${reviewId}/approve`)
        .set(authHeader('mock-jwt-token'))
        .send({ isApproved: true })
        .expect(200);

      expect(response.body.isApproved).toBe(true);
    });

    it('應該成功審核評論（拒絕）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const reviewId = '550e8400-e29b-41d4-a716-446655440000';
      const existingReview = createMockReview({
        id: reviewId,
        isApproved: true,
      });

      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.update.mockResolvedValue({
        ...existingReview,
        isApproved: false,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${reviewId}/approve`)
        .set(authHeader('mock-jwt-token'))
        .send({ isApproved: false })
        .expect(200);

      expect(response.body.isApproved).toBe(false);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .patch('/api/v1/admin/reviews/review-id/approve')
        .set(authHeader('mock-jwt-token'))
        .send({ isApproved: true })
        .expect(403);
    });
  });

  // ========================================
  // 管理員端點：刪除評論
  // ========================================

  describe('DELETE /admin/reviews/:id', () => {
    it('應該成功刪除評論（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const reviewId = '550e8400-e29b-41d4-a716-446655440000';
      const existingReview = createMockReview({ id: reviewId });

      mockPrisma.review.findUnique.mockResolvedValue(existingReview);
      mockPrisma.review.delete.mockResolvedValue(existingReview);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/reviews/${reviewId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該拒絕 STAFF 刪除評論（只有 ADMIN 可以）', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      await request(app.getHttpServer())
        .delete('/api/v1/admin/reviews/review-id')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該拒絕非管理員的請求', async () => {
      const normalUser = createMockUser({ id: 'user-1', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);

      await request(app.getHttpServer())
        .delete('/api/v1/admin/reviews/review-id')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });
});
