import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { Prisma, ScheduleStatus } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有日程（公開 API）
   */
  async findAll() {
    return this.prisma.schedule.findMany({
      where: { isActive: true },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * 取得即將到來的日程
   */
  async findUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * 取得單一日程
   */
  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`日程不存在: ${id}`);
    }

    return schedule;
  }

  /**
   * 取得指定月份的日程
   */
  async findByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * 取得所有日程（管理員用）
   */
  async findAllAdmin() {
    return this.prisma.schedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 建立日程
   */
  async create(dto: CreateScheduleDto) {
    const data: Prisma.ScheduleCreateInput = {
      title: dto.title,
      location: dto.location,
      date: new Date(dto.date),
      time: dto.time,
      status: (dto.status as ScheduleStatus) || ScheduleStatus.upcoming,
      products: dto.products || [],
      description: dto.description,
      contact: dto.contact,
      specialOffer: dto.specialOffer,
      weatherNote: dto.weatherNote,
      isActive: dto.isActive ?? true,
    };

    return this.prisma.schedule.create({ data });
  }

  /**
   * 更新日程
   */
  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);

    const data: Prisma.ScheduleUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.time !== undefined) data.time = dto.time;
    if (dto.status !== undefined) data.status = dto.status as ScheduleStatus;
    if (dto.products !== undefined) data.products = dto.products;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.contact !== undefined) data.contact = dto.contact;
    if (dto.specialOffer !== undefined) data.specialOffer = dto.specialOffer;
    if (dto.weatherNote !== undefined) data.weatherNote = dto.weatherNote;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.schedule.update({
      where: { id },
      data,
    });
  }

  /**
   * 刪除日程
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schedule.delete({ where: { id } });
    return { message: '日程已刪除' };
  }
}
