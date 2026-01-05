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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ========================================
  // 公開 API
  // ========================================

  @Get()
  @ApiOperation({ summary: '取得所有啟用產品' })
  @ApiResponse({ status: 200, description: '成功取得產品列表' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories')
  @ApiOperation({ summary: '取得產品分類列表' })
  @ApiResponse({ status: 200, description: '成功取得分類列表' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('check-name')
  @ApiOperation({ summary: '檢查產品名稱是否重複' })
  @ApiQuery({ name: 'name', required: true, description: '產品名稱' })
  @ApiQuery({
    name: 'excludeId',
    required: false,
    description: '排除的產品 ID',
  })
  @ApiResponse({ status: 200, description: '回傳名稱是否存在' })
  checkName(
    @Query('name') name: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.productsService.checkNameExists(name, excludeId);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得單一產品' })
  @ApiResponse({ status: 200, description: '成功取得產品' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: '取得產品庫存狀態' })
  @ApiResponse({ status: 200, description: '成功取得庫存狀態' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  getInventoryStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getInventoryStatus(id);
  }

  // ========================================
  // 管理員 API（需要認證 + ADMIN 角色）
  // ========================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立產品（管理員）' })
  @ApiResponse({ status: 201, description: '產品建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新產品（管理員）' })
  @ApiResponse({ status: 200, description: '產品更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刪除產品（管理員）' })
  @ApiResponse({ status: 200, description: '產品刪除成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}

// ========================================
// 管理員專用控制器
// ========================================

@ApiTags('admin/products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '取得所有產品（含下架）' })
  @ApiResponse({ status: 200, description: '成功取得所有產品列表' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  findAll() {
    return this.productsService.findAllAdmin();
  }
}
