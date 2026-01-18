/**
 * 產品與搜尋 E2E 測試
 *
 * 測試產品瀏覽和搜尋功能：
 * - 產品列表
 * - 產品詳情
 * - 全站搜尋
 * - 搜尋建議
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup-e2e';
import { createMockProduct, createMockPrismaService } from './utils/test-helpers';

describe('Products API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 產品列表測試
  // ========================================

  describe('GET /products', () => {
    it('應該返回產品列表', async () => {
      const mockProducts = [
        createMockProduct({
          id: 'product-1',
          name: '烏龍茶',
          category: '茶葉',
          price: 500,
        }),
        createMockProduct({
          id: 'product-2',
          name: '綠茶',
          category: '茶葉',
          price: 400,
        }),
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });

    it('應該返回空陣列當沒有產品時', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  // ========================================
  // 單一產品測試
  // ========================================

  describe('GET /products/:id', () => {
    it('應該返回產品詳情', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440001';
      const mockProduct = createMockProduct({
        id: productId,
        name: '高山烏龍茶',
        description: '來自阿里山的優質茶葉',
        price: 800,
      });

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', productId);
      expect(response.body).toHaveProperty('name', '高山烏龍茶');
      expect(response.body).toHaveProperty('price', 800);
    });

    it('應該返回 404 當產品不存在', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440002';
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(404);
    });

    it('應該驗證 UUID 格式', async () => {
      // 無效的 UUID 格式會被驗證攔截，返回 400
      await request(app.getHttpServer())
        .get('/api/v1/products/not-a-valid-uuid')
        .expect(400);
    });
  });

  // ========================================
  // 產品分類測試
  // ========================================

  describe('GET /products/categories', () => {
    it('應該返回分類列表', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { category: '茶葉' },
        { category: '茶包' },
        { category: '禮盒' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/products/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ========================================
  // 產品庫存狀態測試
  // ========================================

  describe('GET /products/:id/inventory', () => {
    it('應該返回庫存狀態', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440003';
      const mockProduct = createMockProduct({
        id: productId,
        stock: 50,
        reservedStock: 5,
      });

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/inventory`)
        .expect(200);

      expect(response.body).toHaveProperty('stock');
    });
  });
});

describe('Search API (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 全站搜尋測試
  // ========================================

  describe('GET /search', () => {
    it('應該返回產品搜尋結果', async () => {
      const mockProducts = [
        createMockProduct({
          id: 'product-1',
          name: '烏龍茶',
        }),
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: '烏龍' })
        .expect(200);

      // Search API 返回 results 而非 products
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('query');
    });

    it('應該處理空搜尋關鍵字', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: '' })
        .expect(200);

      // Search API 返回 results 而非 products
      expect(response.body).toHaveProperty('results');
    });

    it('應該支援分頁參數', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: '茶', limit: 5, offset: 0 })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  // ========================================
  // 搜尋建議測試
  // ========================================

  describe('GET /search/suggestions', () => {
    it('應該返回搜尋建議', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        createMockProduct({ name: '烏龍茶' }),
        createMockProduct({ name: '烏龍茶禮盒' }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/search/suggestions')
        .query({ q: '烏龍' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ========================================
  // 熱門搜尋測試
  // ========================================

  describe('GET /search/trending', () => {
    it('應該返回熱門搜尋', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search/trending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
