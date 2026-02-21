import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SkipCsrf } from '@/common/decorators/skip-csrf.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('admin/notifications')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
@SkipCsrf() // JWT + CORS + RolesGuard already prevent CSRF in cross-domain deployment
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '取得通知列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '成功取得通知列表' })
  async findAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
  ) {
    return this.notificationsService.findAllForAdmin({
      limit,
      offset,
      unreadOnly,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '取得未讀通知數量' })
  @ApiResponse({ status: 200, description: '成功取得未讀數量' })
  async getUnreadCount() {
    const count = await this.notificationsService.getUnreadCount();
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '標記通知為已讀' })
  @ApiResponse({ status: 200, description: '成功標記已讀' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '標記所有通知為已讀' })
  @ApiResponse({ status: 200, description: '成功標記全部已讀' })
  async markAllAsRead() {
    const result = await this.notificationsService.markAllAsRead();
    return { updated: result.count };
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除通知' })
  @ApiResponse({ status: 200, description: '成功刪除通知' })
  async delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}

@ApiTags('admin/stock-alerts')
@Controller('admin/stock-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
@SkipCsrf() // JWT + CORS + RolesGuard already prevent CSRF in cross-domain deployment
export class StockAlertsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '取得庫存預警設定列表' })
  @ApiResponse({ status: 200, description: '成功取得設定列表' })
  async getSettings() {
    return this.notificationsService.getStockAlertSettings();
  }

  @Patch(':productId')
  @ApiOperation({ summary: '更新產品庫存預警設定' })
  @ApiResponse({ status: 200, description: '成功更新設定' })
  async updateSetting(
    @Param('productId') productId: string,
    @Body() body: { threshold?: number; isEnabled?: boolean },
  ) {
    return this.notificationsService.upsertStockAlertSetting(productId, body);
  }
}
