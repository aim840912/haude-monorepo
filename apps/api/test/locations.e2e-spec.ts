/**
 * 門市據點 E2E 測試
 *
 * 測試功能：
 * - 公開端點：列表、詳情、主要據點
 * - 管理員端點：CRUD 操作、圖片管理
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
  createMockLocation,
} from './utils/test-helpers';

describe('Locations API (e2e)', () => {
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

  describe('GET /locations', () => {
    it('應該返回所有啟用的門市據點', async () => {
      const mockLocations = [
        createMockLocation({ id: 'loc-1', name: '總店', isMain: true }),
        createMockLocation({ id: 'loc-2', name: '分店', isMain: false }),
      ];

      mockPrisma.location.findMany.mockResolvedValue(mockLocations);

      const response = await request(app.getHttpServer())
        .get('/api/v1/locations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('總店');
    });

    it('應該返回空陣列當沒有門市據點', async () => {
      mockPrisma.location.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/locations')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /locations/main', () => {
    it('應該返回主要門市據點', async () => {
      const mainLocation = createMockLocation({
        id: 'loc-main',
        name: '豪德製茶所總店',
        isMain: true,
      });

      mockPrisma.location.findFirst.mockResolvedValue(mainLocation);

      const response = await request(app.getHttpServer())
        .get('/api/v1/locations/main')
        .expect(200);

      expect(response.body.isMain).toBe(true);
      expect(response.body.name).toBe('豪德製茶所總店');
    });

    it('應該返回 404 當沒有主要門市', async () => {
      mockPrisma.location.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/locations/main')
        .expect(404);
    });
  });

  describe('GET /locations/:id', () => {
    it('應該返回門市據點詳情', async () => {
      const locationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockLocation = createMockLocation({
        id: locationId,
        name: '竹山門市',
        address: '南投縣竹山鎮...',
        images: [],
      });

      mockPrisma.location.findUnique.mockResolvedValue(mockLocation);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/locations/${locationId}`)
        .expect(200);

      expect(response.body.id).toBe(locationId);
      expect(response.body.name).toBe('竹山門市');
    });

    it('應該返回 404 當門市據點不存在', async () => {
      mockPrisma.location.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/locations/550e8400-e29b-41d4-a716-446655440001')
        .expect(404);
    });
  });

  // ========================================
  // 管理員端點
  // ========================================

  describe('GET /admin/locations', () => {
    it('應該返回所有門市據點（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockLocations = [
        createMockLocation({ id: 'loc-1', isActive: true }),
        createMockLocation({ id: 'loc-2', isActive: false }),
      ];

      mockPrisma.location.findMany.mockResolvedValue(mockLocations);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/locations')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/locations')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  describe('POST /admin/locations/draft', () => {
    it('應該建立草稿門市據點', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockDraft = createMockLocation({
        id: 'draft-1',
        name: '未命名門市',
        isActive: false,
      });

      mockPrisma.location.create.mockResolvedValue(mockDraft);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/locations/draft')
        .set(authHeader('mock-jwt-token'))
        .expect(201);

      expect(response.body.name).toBe('未命名門市');
    });
  });

  describe('POST /admin/locations', () => {
    it('應該建立新門市據點', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const newLocation = createMockLocation({
        id: 'new-loc',
        name: '台中門市',
        isMain: false,
      });

      mockPrisma.location.create.mockResolvedValue(newLocation);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/locations')
        .set(authHeader('mock-jwt-token'))
        .send({
          name: '台中門市',
          address: '台中市西區...',
          phone: '04-22334455',
          hours: '09:00-18:00',
          isMain: false,
        })
        .expect(201);

      expect(response.body.name).toBe('台中門市');
    });

    it('應該設為主要據點並取消其他主要', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const newMainLocation = createMockLocation({
        id: 'new-main',
        name: '新總店',
        isMain: true,
      });

      mockPrisma.location.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.location.create.mockResolvedValue(newMainLocation);

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/locations')
        .set(authHeader('mock-jwt-token'))
        .send({
          name: '新總店',
          address: '新地址...',
          isMain: true,
        })
        .expect(201);

      expect(response.body.isMain).toBe(true);
    });
  });

  describe('PUT /admin/locations/:id', () => {
    it('應該更新門市據點', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const locationId = '550e8400-e29b-41d4-a716-446655440000';
      const existingLocation = createMockLocation({
        id: locationId,
        name: '舊名稱',
        images: [],
      });

      mockPrisma.location.findUnique.mockResolvedValue(existingLocation);
      mockPrisma.location.update.mockResolvedValue({
        ...existingLocation,
        name: '新名稱',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/locations/${locationId}`)
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(200);

      expect(response.body.name).toBe('新名稱');
    });

    it('應該返回 404 當門市據點不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.location.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/admin/locations/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(404);
    });
  });

  describe('DELETE /admin/locations/:id', () => {
    it('應該刪除門市據點', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const locationId = '550e8400-e29b-41d4-a716-446655440000';
      const existingLocation = createMockLocation({
        id: locationId,
        images: [],
      });

      mockPrisma.location.findUnique.mockResolvedValue(existingLocation);
      mockPrisma.location.delete.mockResolvedValue(existingLocation);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/locations/${locationId}`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該返回 404 當門市據點不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      mockPrisma.location.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/admin/locations/550e8400-e29b-41d4-a716-446655440001')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });
  });

  // ========================================
  // 圖片管理 API
  // ========================================

  describe('GET /admin/locations/:id/images', () => {
    it('應該返回門市圖片列表', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const locationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockImages = [
        { id: 'img-1', storageUrl: 'https://...', displayPosition: 0 },
        { id: 'img-2', storageUrl: 'https://...', displayPosition: 1 },
      ];

      mockPrisma.location.findUnique.mockResolvedValue(
        createMockLocation({ id: locationId, images: [] }),
      );
      mockPrisma.locationImage.findMany.mockResolvedValue(mockImages);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/locations/${locationId}/images`)
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });
});
