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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FarmToursService } from './farm-tours.service';
import {
  CreateFarmTourDto,
  UpdateFarmTourDto,
  CreateBookingDto,
  CreateFarmTourImageDto,
  UpdateFarmTourImageDto,
  ReorderFarmTourImagesDto,
  GetFarmTourUploadUrlDto,
} from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { JwtUser } from '@/modules/auth/strategies/jwt.strategy';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Cacheable, NoCache } from '@/common/decorators/cacheable.decorator';


/**
 * 公開 API + 使用者預約
 * Class 層級 @Cacheable(300) 讓公開 GET 有快取
 * 認證端點用 @NoCache() 覆蓋
 */
@Controller('farm-tours')
@Cacheable(300)
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

  // 需要登入的操作（覆蓋 class 層級的 @Cacheable）
  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @NoCache()
  createBooking(
    @Request() req: { user: JwtUser },
    @Body() dto: CreateBookingDto,
  ) {
    return this.farmToursService.createBooking(req.user.userId, dto);
  }

  @Get('bookings/my')
  @UseGuards(JwtAuthGuard)
  @NoCache()
  getMyBookings(@Request() req: { user: JwtUser }) {
    return this.farmToursService.getUserBookings(req.user.userId);
  }

  @Patch('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @NoCache()
  cancelBooking(@Request() req: { user: JwtUser }, @Param('id') id: string) {
    return this.farmToursService.cancelBooking(req.user.userId, id);
  }
}

/**
 * 管理員 API
 */
@Controller('admin/farm-tours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@NoCache()
export class AdminFarmToursController {
  constructor(private readonly farmToursService: FarmToursService) {}

  @Get()
  findAll() {
    return this.farmToursService.findAllAdmin();
  }

  @Post('draft')
  createDraft() {
    return this.farmToursService.createDraft();
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

  // ========================================
  // 圖片管理 API
  // ========================================

  @Get(':id/images')
  getImages(@Param('id', ParseUUIDPipe) id: string) {
    return this.farmToursService.getImages(id);
  }

  @Post(':id/images/upload-url')
  getUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GetFarmTourUploadUrlDto,
  ) {
    return this.farmToursService.getUploadUrl(id, dto.fileName);
  }

  @Post(':id/images')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFarmTourImageDto,
  ) {
    return this.farmToursService.addImage(id, dto);
  }

  @Put(':id/images/:imageId')
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateFarmTourImageDto,
  ) {
    return this.farmToursService.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.farmToursService.removeImage(id, imageId);
  }

  @Put(':id/images/reorder')
  reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderFarmTourImagesDto,
  ) {
    return this.farmToursService.reorderImages(id, dto.imageIds);
  }
}
