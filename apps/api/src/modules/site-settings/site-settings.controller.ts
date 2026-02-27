import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SiteSettingsService } from './site-settings.service';
import {
  UpsertSiteSettingDto,
  GetSiteImageUploadUrlDto,
  DeleteImageFileDto,
} from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Cacheable, NoCache } from '@/common/decorators/cacheable.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

// ========================================
// Public Controller — no auth required
// ========================================

@ApiTags('site-settings')
@Controller('site-settings')
@Cacheable(60)
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: '批量查詢網站設定（公開）' })
  @ApiQuery({
    name: 'keys',
    required: true,
    description: '設定鍵列表，逗號分隔',
    example: 'home.hero_images,home.feature_card_1_image',
  })
  @ApiResponse({ status: 200, description: '成功取得設定列表' })
  findByKeys(@Query('keys') keys: string) {
    const keyArray = keys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    return this.siteSettingsService.findByKeys(keyArray);
  }
}

// ========================================
// Admin Controller — requires ADMIN role
// ========================================

@ApiTags('admin/site-settings')
@Controller('admin/site-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@NoCache()
export class AdminSiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: '列出全部設定（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得所有設定' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  findAll() {
    return this.siteSettingsService.findAll();
  }

  @Put(':key')
  @AuditLog('UPDATE', 'site-settings', 'key')
  @ApiOperation({ summary: '新增或更新設定值（管理員）' })
  @ApiResponse({ status: 200, description: '設定更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertSiteSettingDto,
  ) {
    return this.siteSettingsService.upsert(key, dto);
  }

  @Post('images/upload-url')
  @ApiOperation({ summary: '取得網站圖片上傳 URL（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得上傳 URL' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getImageUploadUrl(@Body() dto: GetSiteImageUploadUrlDto) {
    return this.siteSettingsService.getImageUploadUrl(dto.key, dto.fileName);
  }

  @Delete('images/file')
  @ApiOperation({ summary: '刪除單張 Storage 圖片檔案（管理員）' })
  @ApiResponse({ status: 200, description: '檔案刪除成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  deleteImageFile(@Body() dto: DeleteImageFileDto) {
    return this.siteSettingsService.deleteImage(dto.filePath);
  }

  @Delete('images/:key')
  @AuditLog('DELETE', 'site-settings', 'key')
  @ApiOperation({ summary: '刪除網站圖片（管理員）' })
  @ApiResponse({ status: 200, description: '圖片刪除成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  deleteImage(@Param('key') key: string) {
    return this.siteSettingsService.deleteImageSetting(key);
  }
}
