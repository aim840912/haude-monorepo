import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ReportFiltersDto, SalesDetailFiltersDto } from './dto/report-filters.dto';

@ApiTags('admin/reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: '取得銷售摘要（含同比環比）' })
  async getSalesSummary(@Query() filters: ReportFiltersDto) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    // 設定結束日期為當天的 23:59:59
    endDate.setHours(23, 59, 59, 999);

    return this.reportsService.getSalesSummary(
      startDate,
      endDate,
      filters.compareMode,
    );
  }

  @Get('sales-trend')
  @ApiOperation({ summary: '取得銷售趨勢' })
  async getSalesTrend(@Query() filters: ReportFiltersDto) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    return this.reportsService.getSalesTrend(
      startDate,
      endDate,
      filters.groupBy || 'day',
    );
  }

  @Get('sales-detail')
  @ApiOperation({ summary: '取得銷售明細（分頁）' })
  async getSalesDetail(@Query() filters: SalesDetailFiltersDto) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    return this.reportsService.getSalesDetail(
      startDate,
      endDate,
      filters.limit || 20,
      filters.offset || 0,
    );
  }
}
