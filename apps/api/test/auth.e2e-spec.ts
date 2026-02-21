/**
 * 認證流程 E2E 測試
 *
 * 測試完整的用戶認證生命週期：
 * - 註冊
 * - 登入
 * - 取得當前用戶
 * - 未授權存取
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import { createMockUser, createMockPrismaService } from './utils/test-helpers';
import * as bcrypt from 'bcrypt';

describe('Auth API (e2e)', () => {
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
  // 註冊測試
  // ========================================

  describe('POST /auth/register', () => {
    it('應該成功註冊新用戶並返回 user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: '新用戶',
      };

      // Mock: 確認 email 不存在
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock: 建立用戶成功
      const createdUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
        name: registerDto.name,
      });
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.name).toBe(registerDto.name);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('應該拒絕重複的 email 並返回 409', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: '重複用戶',
      };

      // Mock: email 已存在
      mockPrisma.user.findUnique.mockResolvedValue(
        createMockUser({ email: registerDto.email }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('應該驗證 email 格式', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: 'password123',
        name: '測試',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidDto)
        .expect(400);
    });

    it('應該驗證密碼最小長度', async () => {
      const invalidDto = {
        email: 'test@example.com',
        password: '123', // 太短
        name: '測試',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  // ========================================
  // 登入測試
  // ========================================

  describe('POST /auth/login', () => {
    it('應該成功登入並返回 user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock: 找到用戶（密碼已 hash）
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const existingUser = createMockUser({
        email: loginDto.email,
        password: hashedPassword,
      });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(existingUser);

      // 注意：NestJS @Post() 默認返回 201 Created
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(loginDto.email);
    });

    it('應該拒絕錯誤密碼並返回 401', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock: 找到用戶但密碼不對
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const existingUser = createMockUser({
        email: loginDto.email,
        password: hashedPassword,
        failedLoginAttempts: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        failedLoginAttempts: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('應該拒絕不存在的用戶並返回 401', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock: 用戶不存在
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('應該拒絕已停用的帳號', async () => {
      const loginDto = {
        email: 'disabled@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const disabledUser = createMockUser({
        email: loginDto.email,
        password: hashedPassword,
        isActive: false,
      });
      mockPrisma.user.findUnique.mockResolvedValue(disabledUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('停用');
    });
  });

  // ========================================
  // 取得當前用戶測試
  // ========================================

  describe('GET /auth/me', () => {
    it('應該返回當前用戶資訊（需要有效 token）', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
        name: '測試用戶',
      });

      // Mock: JwtStrategy 查詢用戶
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set(authHeader('mock-jwt-token'))
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email');
    });

    it('應該拒絕未提供 token 的請求', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  // ========================================
  // 登出測試
  // ========================================

  describe('POST /auth/logout', () => {
    it('應該成功登出', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // 注意：NestJS @Post() 默認返回 201 Created
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set(authHeader('mock-jwt-token'))
        .expect(201);

      expect(response.body.message).toContain('Logged out');
    });
  });
});
