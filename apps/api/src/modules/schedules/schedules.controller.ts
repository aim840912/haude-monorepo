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
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Cacheable, NoCache } from '@/common/decorators/cacheable.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { ParseBoundedIntPipe } from '@/common/pipes/parse-bounded-int.pipe';

/**
 * 公開 API
 */
@Controller('schedules')
@Cacheable(300)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.schedulesService.findUpcoming();
  }

  @Get('month')
  findByMonth(
    @Query('year', new ParseBoundedIntPipe({ min: 2000, max: 2100 }))
    year: number,
    @Query('month', new ParseBoundedIntPipe({ min: 1, max: 12 }))
    month: number,
  ) {
    return this.schedulesService.findByMonth(year, month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOnePublic(id);
  }
}

/**
 * 管理員 API (STAFF 和 ADMIN 可存取)
 */
@Controller('admin/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@NoCache()
export class AdminSchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll() {
    return this.schedulesService.findAllAdmin();
  }

  // The admin edit form loads inactive schedules too; the public route hides them.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @AuditLog('CREATE', 'schedules')
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Put(':id')
  @AuditLog('UPDATE', 'schedules')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @AuditLog('DELETE', 'schedules')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
