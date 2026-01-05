import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFarmTourDto, UpdateFarmTourDto, CreateBookingDto } from './dto';
import { Prisma, FarmTourStatus } from '@prisma/client';

@Injectable()
export class FarmToursService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有農場體驗（公開 API）
   */
  async findAll() {
    return this.prisma.farmTour.findMany({
      where: { isActive: true },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * 取得即將舉行的體驗
   */
  async findUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.farmTour.findMany({
      where: {
        isActive: true,
        status: FarmTourStatus.upcoming,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * 取得單一農場體驗
   */
  async findOne(id: string) {
    const tour = await this.prisma.farmTour.findUnique({
      where: { id },
      include: { bookings: true },
    });

    if (!tour) {
      throw new NotFoundException(`農場體驗不存在: ${id}`);
    }

    return tour;
  }

  /**
   * 取得所有體驗（管理員用）
   */
  async findAllAdmin() {
    return this.prisma.farmTour.findMany({
      include: { bookings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 建立農場體驗
   */
  async create(dto: CreateFarmTourDto) {
    const data: Prisma.FarmTourCreateInput = {
      name: dto.name,
      description: dto.description,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      price: dto.price,
      maxParticipants: dto.maxParticipants,
      location: dto.location,
      imageUrl: dto.imageUrl,
      status: dto.status as FarmTourStatus,
      type: dto.type as any,
      tags: dto.tags || [],
      isActive: dto.isActive ?? true,
    };

    return this.prisma.farmTour.create({ data });
  }

  /**
   * 更新農場體驗
   */
  async update(id: string, dto: UpdateFarmTourDto) {
    await this.findOne(id);

    const data: Prisma.FarmTourUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.startTime !== undefined) data.startTime = dto.startTime;
    if (dto.endTime !== undefined) data.endTime = dto.endTime;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.maxParticipants !== undefined) data.maxParticipants = dto.maxParticipants;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.status !== undefined) data.status = dto.status as FarmTourStatus;
    if (dto.type !== undefined) data.type = dto.type as any;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.farmTour.update({
      where: { id },
      data,
    });
  }

  /**
   * 刪除農場體驗
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.farmTour.delete({ where: { id } });
    return { message: '農場體驗已刪除' };
  }

  // ========================================
  // 預約相關
  // ========================================

  /**
   * 建立預約
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    const tour = await this.findOne(dto.tourId);

    const availableSpots = tour.maxParticipants - tour.currentParticipants;
    if (dto.participants > availableSpots) {
      throw new BadRequestException(`名額不足，目前剩餘 ${availableSpots} 個名額`);
    }

    // 建立預約並更新人數
    const [booking] = await this.prisma.$transaction([
      this.prisma.farmTourBooking.create({
        data: {
          tourId: dto.tourId,
          userId,
          participants: dto.participants,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          notes: dto.notes,
        },
      }),
      this.prisma.farmTour.update({
        where: { id: dto.tourId },
        data: {
          currentParticipants: { increment: dto.participants },
        },
      }),
    ]);

    return booking;
  }

  /**
   * 取得使用者預約
   */
  async getUserBookings(userId: string) {
    return this.prisma.farmTourBooking.findMany({
      where: { userId },
      include: { tour: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 取消預約
   */
  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.farmTourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('預約不存在');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('無權取消此預約');
    }

    // 取消預約並更新人數
    await this.prisma.$transaction([
      this.prisma.farmTourBooking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      }),
      this.prisma.farmTour.update({
        where: { id: booking.tourId },
        data: {
          currentParticipants: { decrement: booking.participants },
        },
      }),
    ]);

    return { message: '預約已取消' };
  }
}
