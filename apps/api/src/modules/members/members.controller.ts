import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role, MemberLevel } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { AdjustLevelDto, AdjustPointsDto } from './dto';

@ApiTags('members')
@Controller('members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me/level')
  @ApiOperation({ summary: '取得會員等級資訊' })
  @ApiResponse({ status: 200, description: '成功取得會員等級資訊' })
  @ApiResponse({ status: 401, description: '未認證' })
  async getLevelInfo(@Request() req: { user: { userId: string } }) {
    return this.membersService.getLevelInfo(req.user.userId);
  }

  @Get('me/upgrade-progress')
  @ApiOperation({ summary: '取得升級進度' })
  @ApiResponse({ status: 200, description: '成功取得升級進度' })
  @ApiResponse({ status: 401, description: '未認證' })
  async getUpgradeProgress(@Request() req: { user: { userId: string } }) {
    return this.membersService.getUpgradeProgress(req.user.userId);
  }

  @Get('me/points')
  @ApiOperation({ summary: '取得積分餘額' })
  @ApiResponse({ status: 200, description: '成功取得積分餘額' })
  @ApiResponse({ status: 401, description: '未認證' })
  async getPointsBalance(@Request() req: { user: { userId: string } }) {
    return this.membersService.getPointsBalance(req.user.userId);
  }

  @Get('me/points/history')
  @ApiOperation({ summary: '取得積分歷史' })
  @ApiResponse({ status: 200, description: '成功取得積分歷史' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每頁筆數' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  async getPointsHistory(
    @Request() req: { user: { userId: string } },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.membersService.getPointsHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('level-configs')
  @ApiOperation({ summary: '取得所有等級設定' })
  @ApiResponse({ status: 200, description: '成功取得等級設定' })
  @ApiResponse({ status: 401, description: '未認證' })
  async getAllLevelConfigs() {
    return this.membersService.getAllLevelConfigs();
  }
}

// ==========================================
// Admin Members Controller
// ==========================================

@ApiTags('admin/members')
@Controller('admin/members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminMembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: '取得會員列表（含等級篩選）' })
  @ApiResponse({ status: 200, description: '成功取得會員列表' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiQuery({ name: 'level', required: false, enum: MemberLevel, description: '會員等級篩選' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜尋（email/姓名）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每頁筆數' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  async getMembers(
    @Query('level') level?: MemberLevel,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.membersService.getAdminMembersList({
      level,
      search,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '取得會員詳細資訊' })
  @ApiResponse({ status: 200, description: '成功取得會員詳情' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiResponse({ status: 404, description: '會員不存在' })
  @ApiParam({ name: 'id', description: '會員 ID' })
  async getMemberDetail(@Param('id') id: string) {
    return this.membersService.getMemberDetail(id);
  }

  @Get(':id/level-history')
  @ApiOperation({ summary: '取得會員等級變更歷史' })
  @ApiResponse({ status: 200, description: '成功取得等級歷史' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiResponse({ status: 404, description: '會員不存在' })
  @ApiParam({ name: 'id', description: '會員 ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每頁筆數' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  async getLevelHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.membersService.getMemberLevelHistory(
      id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id/points/history')
  @ApiOperation({ summary: '取得會員積分交易歷史' })
  @ApiResponse({ status: 200, description: '成功取得積分歷史' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiResponse({ status: 404, description: '會員不存在' })
  @ApiParam({ name: 'id', description: '會員 ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每頁筆數' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  async getPointsHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.membersService.getPointsHistory(
      id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Patch(':id/level')
  @ApiOperation({ summary: '手動調整會員等級' })
  @ApiResponse({ status: 200, description: '成功調整會員等級' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiResponse({ status: 404, description: '會員不存在' })
  @ApiParam({ name: 'id', description: '會員 ID' })
  async adjustLevel(
    @Param('id') id: string,
    @Body() dto: AdjustLevelDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.membersService.adjustMemberLevel(
      id,
      dto.level,
      req.user.userId,
      dto.reason,
    );
  }

  @Patch(':id/points')
  @ApiOperation({ summary: '手動調整會員積分' })
  @ApiResponse({ status: 200, description: '成功調整會員積分' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '無權限' })
  @ApiResponse({ status: 404, description: '會員不存在' })
  @ApiParam({ name: 'id', description: '會員 ID' })
  async adjustPoints(
    @Param('id') id: string,
    @Body() dto: AdjustPointsDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.membersService.adjustMemberPoints(
      id,
      dto.points,
      req.user.userId,
      dto.reason,
    );
  }
}
