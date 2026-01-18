import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

/**
 * 評論統計
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // Query Operations（查詢方法）
  // ========================================

  /**
   * 取得產品評論（分頁）
   */
  async getProductReviews(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      onlyApproved?: boolean;
    },
  ) {
    const { limit = 10, offset = 0, onlyApproved = true } = options || {};

    const where = {
      productId,
      ...(onlyApproved ? { isApproved: true } : {}),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        userName: review.user.name || '匿名用戶',
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerified: review.isVerified,
        isApproved: review.isApproved,
        createdAt: review.createdAt.toISOString(),
      })),
      total,
      hasMore: offset + reviews.length < total,
    };
  }

  /**
   * 取得產品評分統計
   */
  async getReviewStats(productId: string): Promise<ReviewStats> {
    // 確認產品存在
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('找不到此產品');
    }

    // 取得所有已審核通過的評論
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    // 計算統計
    const totalReviews = reviews.length;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution,
      };
    }

    let totalRating = 0;
    for (const review of reviews) {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }

    return {
      averageRating: Math.round((totalRating / totalReviews) * 10) / 10,
      totalReviews,
      ratingDistribution,
    };
  }

  /**
   * 取得單一評論
   */
  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('找不到此評論');
    }

    return review;
  }

  /**
   * 取得所有評論（管理員用）
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    isApproved?: boolean;
  }) {
    const { limit = 20, offset = 0, isApproved } = options || {};

    const where = isApproved !== undefined ? { isApproved } : {};

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          product: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { reviews, total };
  }

  /**
   * 檢查用戶是否購買過產品且已收貨
   * @returns 購買狀態：'delivered' | 'ordered' | 'not_purchased'
   */
  async checkPurchaseHistory(
    userId: string,
    productId: string,
  ): Promise<'delivered' | 'ordered' | 'not_purchased'> {
    // 先檢查是否有已送達的訂單
    const deliveredOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'delivered',
        items: {
          some: { productId },
        },
      },
    });

    if (deliveredOrder) {
      return 'delivered';
    }

    // 檢查是否有其他狀態的訂單（已購買但未送達）
    const otherOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['confirmed', 'processing', 'shipped'] },
        items: {
          some: { productId },
        },
      },
    });

    if (otherOrder) {
      return 'ordered';
    }

    return 'not_purchased';
  }

  /**
   * 查詢用戶對特定產品的評論
   */
  async findUserReviewForProduct(userId: string, productId: string) {
    return this.prisma.review.findUnique({
      where: {
        productId_userId: { productId, userId },
      },
    });
  }

  // ========================================
  // Command Operations（命令方法）
  // ========================================

  /**
   * 新增評論（僅限已收貨用戶）
   */
  async create(userId: string, productId: string, dto: CreateReviewDto) {
    // 確認產品存在
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('找不到此產品');
    }

    // 檢查是否已評論過
    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId: { productId, userId },
      },
    });

    if (existingReview) {
      throw new BadRequestException('您已經評論過此產品');
    }

    // 檢查購買狀態
    const purchaseStatus = await this.checkPurchaseHistory(userId, productId);

    // 只有已收貨才能評價
    if (purchaseStatus === 'not_purchased') {
      throw new ForbiddenException('您尚未購買此產品，無法發表評論');
    }

    if (purchaseStatus === 'ordered') {
      throw new ForbiddenException('收到商品後才能發表評論');
    }

    // 建立評論（已確認是 delivered 狀態）
    return this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        isVerified: true, // 必定是已驗證購買（因為已確認是 delivered）
        isApproved: true, // 預設自動通過（可改為需審核）
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * 更新評論（只有作者可以更新）
   */
  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.findById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('您無權編輯此評論');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * 刪除評論（作者或管理員可刪除）
   */
  async delete(id: string, userId: string, isAdmin: boolean = false) {
    const review = await this.findById(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('您無權刪除此評論');
    }

    await this.prisma.review.delete({ where: { id } });

    return { success: true };
  }

  /**
   * 審核評論（管理員）
   */
  async approve(id: string, isApproved: boolean) {
    await this.findById(id); // 確認評論存在

    return this.prisma.review.update({
      where: { id },
      data: { isApproved },
      include: {
        user: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
