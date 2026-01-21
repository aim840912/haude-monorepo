import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { SystemService } from './system.service';
import { UpdateMaintenanceDto, CreateBannerDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

/**
 * 系統狀態控制器（公開 API）
 */
@ApiTags('system')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @SkipThrottle() // 狀態檢查不受速率限制，方便前端輪詢
  @ApiOperation({ summary: '取得系統狀態' })
  @ApiResponse({
    status: 200,
    description: '成功取得系統狀態',
  })
  getStatus() {
    return this.systemService.getStatus();
  }
}

/**
 * 系統管理控制器（管理員 API）
 */
@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminSystemController {
  constructor(private readonly systemService: SystemService) {}

  // ========================================
  // 維護模式管理
  // ========================================

  @Get('maintenance')
  @ApiOperation({ summary: '取得維護狀態（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得維護狀態' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getMaintenance() {
    return this.systemService.getMaintenance();
  }

  @Post('maintenance')
  @ApiOperation({ summary: '更新維護模式（管理員）' })
  @ApiResponse({ status: 200, description: '維護模式更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  updateMaintenance(@Body() dto: UpdateMaintenanceDto) {
    return this.systemService.updateMaintenance(dto);
  }

  // ========================================
  // 系統公告管理
  // ========================================

  @Get('banners')
  @ApiOperation({ summary: '取得所有公告（含已過期，管理員）' })
  @ApiResponse({ status: 200, description: '成功取得公告列表' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getAllBanners() {
    return this.systemService.getAllBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: '新增系統公告（管理員）' })
  @ApiResponse({ status: 201, description: '公告建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  createBanner(@Body() dto: CreateBannerDto) {
    return this.systemService.createBanner(dto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: '刪除系統公告（管理員）' })
  @ApiResponse({ status: 200, description: '公告刪除成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '公告不存在' })
  deleteBanner(@Param('id', ParseUUIDPipe) id: string) {
    this.systemService.deleteBanner(id);
    return { message: `Banner ${id} deleted successfully` };
  }

  @Delete('banners')
  @ApiOperation({ summary: '清除所有公告（管理員）' })
  @ApiResponse({ status: 200, description: '所有公告已清除' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  clearBanners() {
    this.systemService.clearBanners();
    return { message: 'All banners cleared successfully' };
  }
}
