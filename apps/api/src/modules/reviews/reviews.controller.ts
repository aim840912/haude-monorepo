import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto, ApproveReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

/**
 * 評論 Controller
 *
 * 公開端點：
 * - GET /products/:productId/reviews - 取得產品評論
 * - GET /products/:productId/reviews/stats - 取得評分統計
 *
 * 需認證端點：
 * - POST /products/:productId/reviews - 新增評論
 * - PUT /reviews/:id - 更新評論（作者）
 * - DELETE /reviews/:id - 刪除評論（作者）
 *
 * 管理員端點：
 * - GET /admin/reviews - 取得所有評論
 * - PATCH /admin/reviews/:id/approve - 審核評論
 * - DELETE /admin/reviews/:id - 刪除評論
 */
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ========================================
  // 公開端點
  // ========================================

  /**
   * 取得產品評論
   */
  @Get('products/:productId/reviews')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewsService.getProductReviews(productId, {
      limit: limit ? parseInt(limit, 10) : 10,
      offset: offset ? parseInt(offset, 10) : 0,
      onlyApproved: true,
    });
  }

  /**
   * 取得產品評分統計
   */
  @Get('products/:productId/reviews/stats')
  async getReviewStats(@Param('productId') productId: string) {
    return this.reviewsService.getReviewStats(productId);
  }

  // ========================================
  // 需認證端點
  // ========================================

  /**
   * 檢查用戶是否可以評論此產品
   */
  @Get('products/:productId/reviews/check-eligibility')
  @UseGuards(JwtAuthGuard)
  async checkReviewEligibility(
    @Param('productId') productId: string,
    @Request() req,
  ) {
    const purchaseStatus = await this.reviewsService.checkPurchaseHistory(
      req.user.userId,
      productId,
    );

    const existingReview = await this.reviewsService.findUserReviewForProduct(
      req.user.userId,
      productId,
    );

    return {
      canReview: purchaseStatus === 'delivered' && !existingReview,
      purchaseStatus,
      hasReviewed: !!existingReview,
      message: this.getEligibilityMessage(purchaseStatus, !!existingReview),
    };
  }

  /**
   * 取得評論資格訊息
   */
  private getEligibilityMessage(
    purchaseStatus: 'delivered' | 'ordered' | 'not_purchased',
    hasReviewed: boolean,
  ): string {
    if (hasReviewed) return '您已對此產品發表過評論';
    switch (purchaseStatus) {
      case 'delivered':
        return '您可以發表評論';
      case 'ordered':
        return '收到商品後才能發表評論';
      case 'not_purchased':
        return '購買此產品後才能發表評論';
    }
  }

  /**
   * 新增評論
   */
  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @Request() req,
  ) {
    return this.reviewsService.create(req.user.userId, productId, dto);
  }

  /**
   * 更新評論
   */
  @Put('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewsService.update(id, req.user.userId, dto);
  }

  /**
   * 刪除評論（作者）
   */
  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.userId, false);
  }

  // ========================================
  // 管理員端點
  // ========================================

  /**
   * 取得所有評論（管理員）
   */
  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async getAllReviews(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('isApproved') isApproved?: string,
  ) {
    return this.reviewsService.findAll({
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
    });
  }

  /**
   * 審核評論（管理員）
   */
  @Patch('admin/reviews/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async approveReview(@Param('id') id: string, @Body() dto: ApproveReviewDto) {
    return this.reviewsService.approve(id, dto.isApproved);
  }

  /**
   * 刪除評論（管理員）
   */
  @Delete('admin/reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminDeleteReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.userId, true);
  }
}
