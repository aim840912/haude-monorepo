import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { NoCache } from '@/common/decorators/cacheable.decorator';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@ApiTags('admin-audit-logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@NoCache()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: '查詢後台操作紀錄（可依操作者、類型、日期篩選）' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '僅限管理員' })
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get('operators')
  @ApiOperation({ summary: '有操作紀錄的人員清單（篩選用）' })
  @ApiResponse({ status: 200, description: '成功' })
  findOperators() {
    return this.auditLogsService.findOperators();
  }
}
