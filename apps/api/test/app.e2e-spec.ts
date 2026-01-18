/**
 * 應用程式根端點 E2E 測試
 *
 * 測試基本健康檢查和應用程式狀態
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup-e2e';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterEach(async () => {
    await app.close();
  });

  // ========================================
  // 根端點測試
  // ========================================

  describe('GET /api/v1/', () => {
    it('應該返回歡迎訊息', () => {
      return request(app.getHttpServer())
        .get('/api/v1/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  // ========================================
  // 健康檢查測試
  // ========================================

  describe('GET /health', () => {
    it('應該返回健康狀態', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
