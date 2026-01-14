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
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductImageDto,
  UpdateProductImageDto,
  ReorderImagesDto,
  GetUploadUrlDto,
} from './dto';
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
  @ApiOperation({ summary: '取得所有產品（含下架，預設排除草稿）' })
  @ApiResponse({ status: 200, description: '成功取得所有產品列表' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  findAll() {
    return this.productsService.findAllAdmin();
  }

  @Post('draft')
  @ApiOperation({ summary: '建立草稿產品（用於新增時先取得 productId）' })
  @ApiResponse({ status: 201, description: '草稿產品建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  createDraft() {
    return this.productsService.createDraft();
  }

  // ========================================
  // 產品圖片管理 API
  // ========================================

  @Get(':id/images')
  @ApiOperation({ summary: '取得產品的所有圖片' })
  @ApiResponse({ status: 200, description: '成功取得圖片列表' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  getImages(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getImages(id);
  }

  @Post(':id/images/upload-url')
  @ApiOperation({ summary: '取得圖片上傳 URL（前端直傳用）' })
  @ApiResponse({ status: 200, description: '成功取得上傳 URL' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  getUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GetUploadUrlDto,
  ) {
    return this.productsService.getUploadUrl(id, dto.fileName);
  }

  @Post(':id/images')
  @ApiOperation({ summary: '新增產品圖片記錄（上傳完成後呼叫）' })
  @ApiResponse({ status: 201, description: '圖片記錄建立成功' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.productsService.addImage(id, dto);
  }

  @Put(':id/images/:imageId')
  @ApiOperation({ summary: '更新產品圖片資訊' })
  @ApiResponse({ status: 200, description: '圖片更新成功' })
  @ApiResponse({ status: 404, description: '產品或圖片不存在' })
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productsService.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: '刪除產品圖片' })
  @ApiResponse({ status: 200, description: '圖片刪除成功' })
  @ApiResponse({ status: 404, description: '產品或圖片不存在' })
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productsService.removeImage(id, imageId);
  }

  @Put(':id/images/reorder')
  @ApiOperation({ summary: '重新排序產品圖片' })
  @ApiResponse({ status: 200, description: '排序更新成功' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.productsService.reorderImages(id, dto.imageIds);
  }
}
