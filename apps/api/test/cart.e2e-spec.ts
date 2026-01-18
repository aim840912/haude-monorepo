/**
 * 購物車 E2E 測試
 *
 * 測試購物車完整流程：
 * - 取得購物車
 * - 加入商品
 * - 更新數量
 * - 移除商品
 * - 清空購物車
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockProduct,
  createMockCart,
} from './utils/test-helpers';

describe('Cart API (e2e)', () => {
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
  // 取得購物車測試
  // ========================================

  describe('GET /cart', () => {
    it('應該返回購物車內容', async () => {
      const mockCart = createMockCart({
        userId: 'user-123',
        items: [
          {
            id: 'cart-item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 2,
            createdAt: new Date(),
            product: {
              id: 'product-1',
              name: '烏龍茶',
              price: 500,
              priceUnit: '75g',
              stock: 100,
              images: [{ storageUrl: 'https://example.com/image.jpg' }],
            },
          },
        ],
      });

      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPrice');
    });

    it('應該返回空購物車當沒有商品時', async () => {
      const emptyCart = createMockCart({ items: [] });
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(emptyCart);

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.totalItems).toBe(0);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer()).get('/api/v1/cart').expect(401);
    });
  });

  // ========================================
  // 加入商品測試
  // ========================================

  describe('POST /cart/items', () => {
    it('應該成功加入商品到購物車', async () => {
      const addItemDto = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
      };

      const mockProduct = createMockProduct({
        id: addItemDto.productId,
        stock: 100,
        reservedStock: 0,
        isActive: true,
      });

      const emptyCart = createMockCart({ items: [] });
      const updatedCart = createMockCart({
        items: [
          {
            id: 'cart-item-new',
            cartId: 'cart-1',
            productId: addItemDto.productId,
            quantity: 2,
            createdAt: new Date(),
            product: {
              id: addItemDto.productId,
              name: '測試產品',
              price: 500,
              priceUnit: '75g',
              stock: 100,
              images: [{ storageUrl: 'https://example.com/image.jpg' }],
            },
          },
        ],
      });

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cart.findUnique
        .mockResolvedValueOnce(emptyCart)
        .mockResolvedValueOnce(updatedCart);
      mockPrisma.cartItem.create.mockResolvedValue({
        id: 'cart-item-new',
        cartId: 'cart-1',
        productId: addItemDto.productId,
        quantity: 2,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader('mock-jwt-token'))
        .send(addItemDto)
        .expect(201);

      expect(response.body).toHaveProperty('items');
    });

    it('應該拒絕不存在的產品', async () => {
      const addItemDto = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      };

      mockPrisma.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader('mock-jwt-token'))
        .send(addItemDto)
        .expect(404);
    });

    it('應該拒絕已下架的產品', async () => {
      const addItemDto = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      };

      const inactiveProduct = createMockProduct({
        id: addItemDto.productId,
        isActive: false,
      });
      mockPrisma.product.findUnique.mockResolvedValue(inactiveProduct);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader('mock-jwt-token'))
        .send(addItemDto)
        .expect(400);
    });

    it('應該拒絕庫存不足的產品', async () => {
      const addItemDto = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      };

      const outOfStockProduct = createMockProduct({
        id: addItemDto.productId,
        stock: 0,
        reservedStock: 0,
        isActive: true,
      });
      mockPrisma.product.findUnique.mockResolvedValue(outOfStockProduct);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader('mock-jwt-token'))
        .send(addItemDto)
        .expect(400);
    });

    it('應該驗證數量必須為正整數', async () => {
      const invalidDto = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      };

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader('mock-jwt-token'))
        .send(invalidDto)
        .expect(400);
    });
  });

  // ========================================
  // 更新數量測試
  // ========================================

  describe('PUT /cart/items/:productId', () => {
    it('應該成功更新商品數量', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = { quantity: 5 };

      const cartWithItem = createMockCart({
        items: [
          {
            id: 'cart-item-1',
            cartId: 'cart-1',
            productId,
            quantity: 2,
            createdAt: new Date(),
            product: {
              id: productId,
              name: '測試產品',
              price: 500,
              priceUnit: '75g',
              stock: 100,
              images: [],
            },
          },
        ],
      });

      const updatedCart = createMockCart({
        items: [
          {
            ...cartWithItem.items[0],
            quantity: 5,
          },
        ],
      });

      mockPrisma.cart.findUnique
        .mockResolvedValueOnce(cartWithItem)
        .mockResolvedValueOnce(updatedCart);
      mockPrisma.product.findUnique.mockResolvedValue(
        createMockProduct({ id: productId, stock: 100 }),
      );
      mockPrisma.cartItem.update.mockResolvedValue({
        id: 'cart-item-1',
        quantity: 5,
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/cart/items/${productId}`)
        .set(authHeader('mock-jwt-token'))
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('應該返回 404 當商品不在購物車中', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = { quantity: 5 };

      const emptyCart = createMockCart({ items: [] });
      mockPrisma.cart.findUnique.mockResolvedValue(emptyCart);

      await request(app.getHttpServer())
        .put(`/api/v1/cart/items/${productId}`)
        .set(authHeader('mock-jwt-token'))
        .send(updateDto)
        .expect(404);
    });
  });

  // ========================================
  // 移除商品測試
  // ========================================

  describe('DELETE /cart/items/:productId', () => {
    it('應該成功移除商品', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      const cartWithItem = createMockCart({
        items: [
          {
            id: 'cart-item-1',
            cartId: 'cart-1',
            productId,
            quantity: 2,
            createdAt: new Date(),
            product: {
              id: productId,
              name: '測試產品',
              price: 500,
              priceUnit: '75g',
              stock: 100,
              images: [],
            },
          },
        ],
      });

      const emptyCart = createMockCart({ items: [] });

      mockPrisma.cart.findUnique
        .mockResolvedValueOnce(cartWithItem)
        .mockResolvedValueOnce(emptyCart);
      mockPrisma.cartItem.delete.mockResolvedValue({ id: 'cart-item-1' });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${productId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.items).toHaveLength(0);
    });

    it('應該返回 404 當商品不在購物車中', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const emptyCart = createMockCart({ items: [] });

      mockPrisma.cart.findUnique.mockResolvedValue(emptyCart);

      await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${productId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });
  });

  // ========================================
  // 清空購物車測試
  // ========================================

  describe('DELETE /cart', () => {
    it('應該成功清空購物車', async () => {
      const cart = createMockCart();

      mockPrisma.cart.findUnique.mockResolvedValue(cart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.message).toContain('已清空');
      expect(response.body.totalItems).toBe(0);
    });

    it('應該正常處理空購物車的清空請求', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.message).toContain('已清空');
    });
  });
});
