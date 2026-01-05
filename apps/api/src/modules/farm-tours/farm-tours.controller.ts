import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FarmToursService } from './farm-tours.service';
import { CreateFarmTourDto, UpdateFarmTourDto, CreateBookingDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

/**
 * 公開 API
 */
@Controller('farm-tours')
export class FarmToursController {
  constructor(private readonly farmToursService: FarmToursService) {}

  @Get()
  findAll() {
    return this.farmToursService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.farmToursService.findUpcoming();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmToursService.findOne(id);
  }

  // 需要登入的操作
  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  createBooking(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.farmToursService.createBooking(req.user.id, dto);
  }

  @Get('bookings/my')
  @UseGuards(JwtAuthGuard)
  getMyBookings(@Request() req: any) {
    return this.farmToursService.getUserBookings(req.user.id);
  }

  @Patch('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.farmToursService.cancelBooking(req.user.id, id);
  }
}

/**
 * 管理員 API
 */
@Controller('admin/farm-tours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFarmToursController {
  constructor(private readonly farmToursService: FarmToursService) {}

  @Get()
  findAll() {
    return this.farmToursService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateFarmTourDto) {
    return this.farmToursService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFarmTourDto) {
    return this.farmToursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.farmToursService.remove(id);
  }
}
