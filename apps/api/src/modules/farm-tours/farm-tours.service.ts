import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import {
  CreateFarmTourDto,
  UpdateFarmTourDto,
  CreateBookingDto,
  CreateFarmTourImageDto,
  UpdateFarmTourImageDto,
} from './dto';
import { Prisma, FarmTourStatus, FarmTourType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket 名稱
const FARM_TOUR_IMAGES_BUCKET = 'farm-tour-images';

@Injectable()
export class FarmToursService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

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
   * 建立草稿（用於新增時先取得 ID，讓圖片上傳可運作）
   */
  async createDraft() {
    return this.prisma.farmTour.create({
      data: {
        name: '未命名活動',
        description: '',
        date: new Date(),
        startTime: '',
        endTime: '',
        price: 0,
        maxParticipants: 20,
        location: '',
        type: 'tour',
        status: 'upcoming',
        isDraft: true,
      },
      include: { images: true },
    });
  }

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
      type: dto.type as FarmTourType,
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
    if (dto.maxParticipants !== undefined)
      data.maxParticipants = dto.maxParticipants;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.status !== undefined) data.status = dto.status as FarmTourStatus;
    if (dto.type !== undefined) data.type = dto.type as FarmTourType;
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
      throw new BadRequestException(
        `名額不足，目前剩餘 ${availableSpots} 個名額`,
      );
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

  // ========================================
  // 圖片管理方法（Image Operations）
  // ========================================

  /**
   * 取得簽名上傳 URL（讓前端直傳到 Supabase Storage）
   */
  async getUploadUrl(farmTourId: string, fileName: string) {
    // 確認農場體驗存在
    await this.findOne(farmTourId);

    // 生成唯一檔名，避免覆蓋
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${ext}`;
    const filePath = `${farmTourId}/${uniqueFileName}`;

    const { signedUrl, path } = await this.supabase.createSignedUploadUrl(
      FARM_TOUR_IMAGES_BUCKET,
      filePath,
    );

    // 取得公開 URL
    const publicUrl = this.supabase.getPublicUrl(FARM_TOUR_IMAGES_BUCKET, path);

    return {
      uploadUrl: signedUrl,
      filePath: path,
      publicUrl,
    };
  }

  /**
   * 新增農場體驗圖片記錄
   */
  async addImage(farmTourId: string, dto: CreateFarmTourImageDto) {
    // 確認農場體驗存在
    await this.findOne(farmTourId);

    // 如果沒有指定 displayPosition，放到最後
    if (dto.displayPosition === undefined) {
      const maxPosition = await this.prisma.farmTourImage.aggregate({
        where: { farmTourId },
        _max: { displayPosition: true },
      });
      dto.displayPosition = (maxPosition._max.displayPosition ?? -1) + 1;
    }

    return this.prisma.farmTourImage.create({
      data: {
        farmTourId,
        storageUrl: dto.storageUrl,
        filePath: dto.filePath,
        altText: dto.altText,
        displayPosition: dto.displayPosition,
        size: dto.size || 'medium',
      },
    });
  }

  /**
   * 更新農場體驗圖片
   */
  async updateImage(
    farmTourId: string,
    imageId: string,
    dto: UpdateFarmTourImageDto,
  ) {
    // 確認圖片存在
    const image = await this.prisma.farmTourImage.findFirst({
      where: { id: imageId, farmTourId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    return this.prisma.farmTourImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  /**
   * 刪除農場體驗圖片
   */
  async removeImage(farmTourId: string, imageId: string) {
    // 確認圖片存在並取得檔案路徑
    const image = await this.prisma.farmTourImage.findFirst({
      where: { id: imageId, farmTourId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    // 從 Supabase Storage 刪除檔案
    try {
      await this.supabase.deleteFile(FARM_TOUR_IMAGES_BUCKET, image.filePath);
    } catch (error) {
      // 檔案可能不存在，記錄但不阻止刪除記錄
      console.warn(
        `Failed to delete file from storage: ${image.filePath}`,
        error,
      );
    }

    // 刪除資料庫記錄
    await this.prisma.farmTourImage.delete({
      where: { id: imageId },
    });

    return { message: '圖片已刪除' };
  }

  /**
   * 重新排序圖片
   */
  async reorderImages(farmTourId: string, imageIds: string[]) {
    // 確認農場體驗存在
    await this.findOne(farmTourId);

    // 批次更新排序
    const updates = imageIds.map((id, index) =>
      this.prisma.farmTourImage.updateMany({
        where: { id, farmTourId },
        data: { displayPosition: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // 回傳更新後的圖片列表
    return this.prisma.farmTourImage.findMany({
      where: { farmTourId },
      orderBy: { displayPosition: 'asc' },
    });
  }

  /**
   * 取得農場體驗的所有圖片
   */
  async getImages(farmTourId: string) {
    // 確認農場體驗存在
    await this.findOne(farmTourId);

    return this.prisma.farmTourImage.findMany({
      where: { farmTourId },
      orderBy: { displayPosition: 'asc' },
    });
  }
}
