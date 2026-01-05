import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有據點（公開 API）
   */
  async findAll() {
    return this.prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * 取得主要據點
   */
  async findMain() {
    const location = await this.prisma.location.findFirst({
      where: { isMain: true, isActive: true },
    });

    if (!location) {
      throw new NotFoundException('找不到主要據點');
    }

    return location;
  }

  /**
   * 取得單一據點
   */
  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`據點不存在: ${id}`);
    }

    return location;
  }

  /**
   * 取得所有據點（管理員用）
   */
  async findAllAdmin() {
    return this.prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 建立據點
   */
  async create(dto: CreateLocationDto) {
    // 如果設為主要據點，先將其他據點取消主要
    if (dto.isMain) {
      await this.prisma.location.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      });
    }

    const data: Prisma.LocationCreateInput = {
      name: dto.name,
      title: dto.title,
      address: dto.address,
      landmark: dto.landmark,
      phone: dto.phone,
      lineId: dto.lineId,
      hours: dto.hours,
      closedDays: dto.closedDays,
      parking: dto.parking,
      publicTransport: dto.publicTransport,
      features: dto.features || [],
      specialties: dto.specialties || [],
      lat: dto.lat,
      lng: dto.lng,
      image: dto.image,
      isMain: dto.isMain ?? false,
      isActive: dto.isActive ?? true,
    };

    return this.prisma.location.create({ data });
  }

  /**
   * 更新據點
   */
  async update(id: string, dto: UpdateLocationDto) {
    await this.findOne(id);

    // 如果設為主要據點，先將其他據點取消主要
    if (dto.isMain) {
      await this.prisma.location.updateMany({
        where: { isMain: true, id: { not: id } },
        data: { isMain: false },
      });
    }

    const data: Prisma.LocationUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.landmark !== undefined) data.landmark = dto.landmark;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.lineId !== undefined) data.lineId = dto.lineId;
    if (dto.hours !== undefined) data.hours = dto.hours;
    if (dto.closedDays !== undefined) data.closedDays = dto.closedDays;
    if (dto.parking !== undefined) data.parking = dto.parking;
    if (dto.publicTransport !== undefined) data.publicTransport = dto.publicTransport;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.specialties !== undefined) data.specialties = dto.specialties;
    if (dto.lat !== undefined) data.lat = dto.lat;
    if (dto.lng !== undefined) data.lng = dto.lng;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.isMain !== undefined) data.isMain = dto.isMain;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.location.update({
      where: { id },
      data,
    });
  }

  /**
   * 刪除據點
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.location.delete({ where: { id } });
    return { message: '據點已刪除' };
  }
}
