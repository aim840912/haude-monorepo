import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@ApiTags('discounts')
@Controller()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // ========================================
  // 用戶端 API
  // ========================================

  /**
   * 驗證折扣碼
   * GET /discounts/:code/validate?subtotal=1000
   */
  @Get('discounts/:code/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '驗證折扣碼' })
  async validateDiscount(
    @Param('code') code: string,
    @Query('subtotal') subtotal: string,
    @CurrentUser('userId') userId: string,
  ) {
    const subtotalNum = parseInt(subtotal, 10) || 0;
    return this.discountsService.validateDiscountCode(
      code,
      userId,
      subtotalNum,
    );
  }

  // ========================================
  // 管理員 API
  // ========================================

  /**
   * 取得所有折扣碼
   * GET /admin/discounts
   */
  @Get('admin/discounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得所有折扣碼（管理員）' })
  async findAll(@Query('isActive') isActive?: string) {
    const options =
      isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
    return this.discountsService.findAll(options);
  }

  /**
   * 取得單一折扣碼詳情
   * GET /admin/discounts/:id
   */
  @Get('admin/discounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得折扣碼詳情（管理員）' })
  async findOne(@Param('id') id: string) {
    return this.discountsService.findById(id);
  }

  /**
   * 建立折扣碼
   * POST /admin/discounts
   */
  @Post('admin/discounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立折扣碼（管理員）' })
  async create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(createDiscountDto);
  }

  /**
   * 更新折扣碼
   * PUT /admin/discounts/:id
   */
  @Put('admin/discounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新折扣碼（管理員）' })
  async update(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  /**
   * 刪除折扣碼
   * DELETE /admin/discounts/:id
   */
  @Delete('admin/discounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刪除折扣碼（管理員）' })
  async delete(@Param('id') id: string) {
    return this.discountsService.delete(id);
  }
}
