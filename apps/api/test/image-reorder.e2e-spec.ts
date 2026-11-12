/**
 * 圖片排序路由 E2E 測試
 *
 * `:id/images/reorder` 必須宣告在 `:id/images/:imageId` 之前，
 * 否則 'reorder' 會被當成 imageId，請求落到「更新單張圖片」而回 400。
 * 這類錯誤單元測試抓不到（直接呼叫方法，不經過路由比對）。
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, authHeader } from './setup-e2e';
import { createMockPrismaService, createMockUser } from './utils/test-helpers';

const PARENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const IMAGE_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
];

type MockPrisma = ReturnType<typeof createMockPrismaService>;

const cases: Array<{
  name: string;
  path: string;
  arrange: (prisma: MockPrisma) => void;
}> = [
  {
    name: 'products',
    path: `/api/v1/admin/products/${PARENT_ID}/images/reorder`,
    arrange: (p) => {
      p.product.findUnique.mockResolvedValue({ id: PARENT_ID, name: '茶' });
      p.productImage.findMany.mockResolvedValue([]);
    },
  },
  {
    name: 'farm-tours',
    path: `/api/v1/admin/farm-tours/${PARENT_ID}/images/reorder`,
    arrange: (p) => {
      p.farmTour.findUnique.mockResolvedValue({ id: PARENT_ID, name: '果園' });
      p.farmTourImage.findMany.mockResolvedValue([]);
    },
  },
  {
    name: 'locations',
    path: `/api/v1/admin/locations/${PARENT_ID}/images/reorder`,
    arrange: (p) => {
      p.location.findUnique.mockResolvedValue({ id: PARENT_ID, name: '門市' });
      p.locationImage.findMany.mockResolvedValue([]);
    },
  },
];

describe('Image reorder routes (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: MockPrisma;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    mockPrisma = testApp.mockPrisma;
    mockPrisma.user.findUnique.mockResolvedValue(
      createMockUser({ id: 'admin-1', role: 'ADMIN' }),
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it.each(cases)(
    'PUT $name/:id/images/reorder 會執行排序，不被 :imageId 路由攔走',
    async ({ path, arrange }) => {
      arrange(mockPrisma);

      await request(app.getHttpServer())
        .put(path)
        .set(authHeader('mock-jwt-token'))
        .send({ imageIds: IMAGE_IDS })
        .expect(200);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    },
  );
});
