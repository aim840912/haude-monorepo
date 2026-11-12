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
type ImageModel = 'productImage' | 'farmTourImage' | 'locationImage';

const cases: Array<{
  name: string;
  path: string;
  imageModel: ImageModel;
  arrange: (prisma: MockPrisma) => void;
}> = [
  {
    name: 'products',
    path: `/api/v1/admin/products/${PARENT_ID}/images/reorder`,
    imageModel: 'productImage',
    arrange: (p) => {
      p.product.findUnique.mockResolvedValue({ id: PARENT_ID, name: '茶' });
      p.productImage.findMany.mockResolvedValue([]);
    },
  },
  {
    name: 'farm-tours',
    path: `/api/v1/admin/farm-tours/${PARENT_ID}/images/reorder`,
    imageModel: 'farmTourImage',
    arrange: (p) => {
      p.farmTour.findUnique.mockResolvedValue({ id: PARENT_ID, name: '果園' });
      p.farmTourImage.findMany.mockResolvedValue([]);
    },
  },
  {
    name: 'locations',
    path: `/api/v1/admin/locations/${PARENT_ID}/images/reorder`,
    imageModel: 'locationImage',
    arrange: (p) => {
      p.location.findUnique.mockResolvedValue({ id: PARENT_ID, name: '門市' });
      p.locationImage.findMany.mockResolvedValue([]);
    },
  },
];

const BAD_BODIES = [
  { imageIds: 'not-an-array' },
  { imageIds: ['not-a-uuid'] },
  {},
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
    'PUT $name/:id/images/reorder 依送出的順序寫入位置，不被 :imageId 路由攔走',
    async ({ path, imageModel, arrange }) => {
      arrange(mockPrisma);

      await request(app.getHttpServer())
        .put(path)
        .set(authHeader('mock-jwt-token'))
        .send({ imageIds: IMAGE_IDS })
        .expect(200);

      const written = mockPrisma[imageModel].updateMany.mock.calls.map(
        ([args]: [
          { where: { id: string }; data: { displayPosition: number } },
        ]) => [args.where.id, args.data.displayPosition],
      );
      expect(written).toEqual([
        [IMAGE_IDS[0], 0],
        [IMAGE_IDS[1], 1],
      ]);
    },
  );

  it.each(cases.flatMap((c) => BAD_BODIES.map((body) => ({ ...c, body }))))(
    'PUT $name reorder 收到格式錯誤的 body 回 400，不是 500',
    async ({ path, body }) => {
      await request(app.getHttpServer())
        .put(path)
        .set(authHeader('mock-jwt-token'))
        .send(body)
        .expect(400);
    },
  );
});
