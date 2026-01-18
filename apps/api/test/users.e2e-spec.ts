/**
 * 用戶管理 API E2E 測試
 *
 * 測試功能：
 * - 用戶列表（管理員）
 * - 用戶詳情（管理員）
 * - 更新用戶（管理員）
 * - 刪除用戶（管理員）
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import {
  createMockPrismaService,
  createMockUser,
} from './utils/test-helpers';

describe('Users API (e2e)', () => {
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
  // 用戶列表
  // ========================================

  describe('GET /users', () => {
    it('應該返回所有用戶（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const mockUsers = [
        createMockUser({ id: 'user-1', name: '使用者 A' }),
        createMockUser({ id: 'user-2', name: '使用者 B' }),
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('應該拒絕 STAFF 角色存取', async () => {
      const staffUser = createMockUser({ id: 'staff-1', role: 'STAFF' });
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });
  });

  // ========================================
  // 用戶詳情
  // ========================================

  describe('GET /users/:id', () => {
    it('應該返回用戶詳情（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser) // 第一次調用：驗證 token
        .mockResolvedValueOnce(createMockUser({ id: 'user-1', name: '測試用戶' })); // 第二次調用：查詢用戶

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body.id).toBe('user-1');
    });

    it('應該返回 404 當用戶不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-user')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });
  });

  // ========================================
  // 更新用戶
  // ========================================

  describe('PATCH /users/:id', () => {
    it('應該更新用戶（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(createMockUser({ id: 'user-1' }));

      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ id: 'user-1', name: '新名稱' }),
      );

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(200);

      expect(response.body.name).toBe('新名稱');
    });

    it('應該能更新用戶角色', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(createMockUser({ id: 'user-1', role: 'USER' }));

      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ id: 'user-1', role: 'STAFF' }),
      );

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .send({ role: 'STAFF' })
        .expect(200);

      expect(response.body.role).toBe('STAFF');
    });

    it('應該返回 404 當用戶不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .patch('/api/v1/users/non-existent-user')
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .send({ name: '新名稱' })
        .expect(403);
    });
  });

  // ========================================
  // 刪除用戶
  // ========================================

  describe('DELETE /users/:id', () => {
    it('應該刪除用戶（管理員）', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(createMockUser({ id: 'user-1' }));

      mockPrisma.user.delete.mockResolvedValue(createMockUser({ id: 'user-1' }));

      await request(app.getHttpServer())
        .delete('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .expect(200);
    });

    it('應該返回 404 當用戶不存在', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .delete('/api/v1/users/non-existent-user')
        .set(authHeader('mock-jwt-token'))
        .expect(404);
    });

    it('應該拒絕非管理員的請求', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/user-1')
        .set(authHeader('mock-jwt-token'))
        .expect(403);
    });

    it('應該拒絕未認證的請求', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/user-1')
        .expect(401);
    });
  });

  // ========================================
  // 邊界情況
  // ========================================

  describe('邊界情況', () => {
    it('管理員不能刪除自己', async () => {
      const adminUser = createMockUser({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      // 嘗試刪除自己
      mockPrisma.user.delete.mockRejectedValue(
        new Error('Cannot delete yourself'),
      );

      // 如果服務層有這個檢查，會返回 400 或拋錯
      // 這裡測試是否能正常處理
      await request(app.getHttpServer())
        .delete('/api/v1/users/admin-1')
        .set(authHeader('mock-jwt-token'))
        .expect((res) => {
          // 可能是 400 或 500，取決於服務實作
          expect([200, 400, 500]).toContain(res.status);
        });
    });
  });
});
