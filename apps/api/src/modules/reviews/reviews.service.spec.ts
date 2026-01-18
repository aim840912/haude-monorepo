import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  // Mock Prisma
  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('checkPurchaseHistory', () => {
    const userId = 'user-123';
    const productId = 'product-123';

    it('有已送達訂單應回傳 "delivered"', async () => {
      mockPrismaService.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        userId,
        status: 'delivered',
        items: [{ productId }],
      });

      const result = await service.checkPurchaseHistory(userId, productId);

      expect(result).toBe('delivered');
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledTimes(1);
    });

    it('有確認/處理中/已出貨訂單應回傳 "ordered"', async () => {
      // 第一次查詢 delivered - 沒有
      mockPrismaService.order.findFirst.mockResolvedValueOnce(null);
      // 第二次查詢其他狀態 - 有
      mockPrismaService.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        userId,
        status: 'confirmed',
        items: [{ productId }],
      });

      const result = await service.checkPurchaseHistory(userId, productId);

      expect(result).toBe('ordered');
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledTimes(2);
    });

    it('無任何訂單應回傳 "not_purchased"', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      const result = await service.checkPurchaseHistory(userId, productId);

      expect(result).toBe('not_purchased');
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledTimes(2);
    });

    it('只有待處理訂單應回傳 "not_purchased"', async () => {
      // 查詢 delivered 和 confirmed/processing/shipped 都沒有
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      const result = await service.checkPurchaseHistory(userId, productId);

      expect(result).toBe('not_purchased');
    });
  });

  describe('create', () => {
    const userId = 'user-123';
    const productId = 'product-123';
    const createReviewDto = {
      rating: 5,
      title: '很好喝',
      content: '茶葉品質很好！',
    };

    it('產品不存在應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create(userId, productId, createReviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('已評論過應拋出 BadRequestException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'existing-review',
        userId,
        productId,
      });

      await expect(
        service.create(userId, productId, createReviewDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('未購買過應拋出 ForbiddenException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValue(null); // 沒有任何訂單

      await expect(
        service.create(userId, productId, createReviewDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('已購買但未送達應拋出 ForbiddenException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      // 第一次查詢 delivered - 沒有
      mockPrismaService.order.findFirst.mockResolvedValueOnce(null);
      // 第二次查詢其他狀態 - 有（已購買但未送達）
      mockPrismaService.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        status: 'processing',
      });

      await expect(
        service.create(userId, productId, createReviewDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('已送達應成功建立評論', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      // 有 delivered 訂單
      mockPrismaService.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        status: 'delivered',
      });
      mockPrismaService.review.create.mockResolvedValue({
        id: 'new-review',
        productId,
        userId,
        rating: 5,
        isVerified: true,
        isApproved: true,
        user: { id: userId, name: '測試用戶' },
      });

      const result = await service.create(userId, productId, createReviewDto);

      expect(result.isVerified).toBe(true);
      expect(result.isApproved).toBe(true);
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId,
          userId,
          rating: 5,
          isVerified: true,
          isApproved: true,
        }),
        include: expect.any(Object),
      });
    });

    it('建立的評論應標記為 isVerified: true', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        status: 'delivered',
      });
      mockPrismaService.review.create.mockResolvedValue({
        id: 'new-review',
        isVerified: true,
      });

      await service.create(userId, productId, createReviewDto);

      expect(mockPrismaService.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
          }),
        }),
      );
    });
  });

  describe('findUserReviewForProduct', () => {
    const userId = 'user-123';
    const productId = 'product-123';

    it('有評論應回傳評論資料', async () => {
      const mockReview = {
        id: 'review-1',
        userId,
        productId,
        rating: 5,
        title: '很好喝',
      };
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findUserReviewForProduct(userId, productId);

      expect(result).toEqual(mockReview);
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: {
          productId_userId: { productId, userId },
        },
      });
    });

    it('無評論應回傳 null', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      const result = await service.findUserReviewForProduct(userId, productId);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('找不到評論應拋出 NotFoundException', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('找到評論應回傳完整資料', async () => {
      const mockReview = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        user: { id: 'user-1', name: '測試用戶' },
        product: { id: 'product-1', name: '測試茶葉' },
      };
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findById('review-1');

      expect(result).toEqual(mockReview);
    });
  });

  describe('update', () => {
    const reviewId = 'review-1';
    const userId = 'user-123';
    const updateDto = { rating: 4, title: '更新標題' };

    it('非作者更新應拋出 ForbiddenException', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: 'other-user', // 不是當前用戶
        user: {},
        product: {},
      });

      await expect(service.update(reviewId, userId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('作者應可以更新評論', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId, // 是當前用戶
        user: {},
        product: {},
      });
      mockPrismaService.review.update.mockResolvedValue({
        id: reviewId,
        ...updateDto,
      });

      const result = await service.update(reviewId, userId, updateDto);

      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const reviewId = 'review-1';
    const userId = 'user-123';

    it('非作者且非管理員刪除應拋出 ForbiddenException', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: 'other-user',
        user: {},
        product: {},
      });

      await expect(service.delete(reviewId, userId, false)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('作者應可以刪除自己的評論', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId,
        user: {},
        product: {},
      });
      mockPrismaService.review.delete.mockResolvedValue({ id: reviewId });

      const result = await service.delete(reviewId, userId, false);

      expect(result.success).toBe(true);
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });

    it('管理員應可以刪除任何評論', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: 'other-user', // 不是管理員的評論
        user: {},
        product: {},
      });
      mockPrismaService.review.delete.mockResolvedValue({ id: reviewId });

      const result = await service.delete(reviewId, 'admin-user', true); // isAdmin = true

      expect(result.success).toBe(true);
      expect(mockPrismaService.review.delete).toHaveBeenCalled();
    });
  });

  describe('getReviewStats', () => {
    const productId = 'product-123';

    it('產品不存在應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getReviewStats(productId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('無評論應回傳空統計', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getReviewStats(productId);

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('應正確計算平均評分和分布', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 3 },
      ]);

      const result = await service.getReviewStats(productId);

      // (5+5+4+4+3) / 5 = 4.2
      expect(result.averageRating).toBe(4.2);
      expect(result.totalReviews).toBe(5);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 2,
        5: 2,
      });
    });
  });
});
