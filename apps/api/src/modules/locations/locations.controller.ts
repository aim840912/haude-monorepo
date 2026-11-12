import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import {
  CreateLocationDto,
  UpdateLocationDto,
  CreateLocationImageDto,
  UpdateLocationImageDto,
  ReorderLocationImagesDto,
  GetLocationUploadUrlDto,
} from './dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Cacheable, NoCache } from '@/common/decorators/cacheable.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

/**
 * 公開 API
 */
@Controller('locations')
@Cacheable(300)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Get('main')
  findMain() {
    return this.locationsService.findMain();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }
}

/**
 * 管理員 API
 */
@Controller('admin/locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@NoCache()
export class AdminLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll() {
    return this.locationsService.findAllAdmin();
  }

  @Post('draft')
  @AuditLog('CREATE', 'locations')
  createDraft() {
    return this.locationsService.createDraft();
  }

  @Post()
  @AuditLog('CREATE', 'locations')
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Put(':id')
  @AuditLog('UPDATE', 'locations')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @AuditLog('DELETE', 'locations')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  // ========================================
  // 圖片管理 API
  // ========================================

  @Get(':id/images')
  getImages(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.getImages(id);
  }

  @Post(':id/images/upload-url')
  getUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GetLocationUploadUrlDto,
  ) {
    return this.locationsService.getUploadUrl(id, dto.fileName);
  }

  @Post(':id/images')
  @AuditLog('UPDATE', 'locations')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLocationImageDto,
  ) {
    return this.locationsService.addImage(id, dto);
  }

  @Put(':id/images/:imageId')
  @AuditLog('UPDATE', 'locations')
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateLocationImageDto,
  ) {
    return this.locationsService.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @AuditLog('DELETE', 'locations')
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.locationsService.removeImage(id, imageId);
  }

  @Put(':id/images/reorder')
  @AuditLog('UPDATE', 'locations')
  reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderLocationImagesDto,
  ) {
    return this.locationsService.reorderImages(id, dto.imageIds);
  }
}
