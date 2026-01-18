import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import {
  CreateLocationDto,
  UpdateLocationDto,
  CreateLocationImageDto,
  UpdateLocationImageDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket 名稱
const LOCATION_IMAGES_BUCKET = 'location-images';

@Injectable()
export class LocationsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

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
      include: { images: true },
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
      include: { images: true },
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
   * 建立草稿（用於新增時先取得 ID，讓圖片上傳可運作）
   */
  async createDraft() {
    return this.prisma.location.create({
      data: {
        name: '未命名門市',
        address: '',
        isMain: false,
        isActive: true,
        isDraft: true,
      },
      include: { images: true },
    });
  }

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
    if (dto.publicTransport !== undefined)
      data.publicTransport = dto.publicTransport;
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

  // ========================================
  // 圖片管理方法（Image Operations）
  // ========================================

  /**
   * 取得簽名上傳 URL（讓前端直傳到 Supabase Storage）
   */
  async getUploadUrl(locationId: string, fileName: string) {
    // 確認據點存在
    await this.findOne(locationId);

    // 生成唯一檔名，避免覆蓋
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${ext}`;
    const filePath = `${locationId}/${uniqueFileName}`;

    const { signedUrl, path } = await this.supabase.createSignedUploadUrl(
      LOCATION_IMAGES_BUCKET,
      filePath,
    );

    // 取得公開 URL
    const publicUrl = this.supabase.getPublicUrl(LOCATION_IMAGES_BUCKET, path);

    return {
      uploadUrl: signedUrl,
      filePath: path,
      publicUrl,
    };
  }

  /**
   * 新增據點圖片記錄
   */
  async addImage(locationId: string, dto: CreateLocationImageDto) {
    // 確認據點存在
    await this.findOne(locationId);

    // 如果沒有指定 displayPosition，放到最後
    if (dto.displayPosition === undefined) {
      const maxPosition = await this.prisma.locationImage.aggregate({
        where: { locationId },
        _max: { displayPosition: true },
      });
      dto.displayPosition = (maxPosition._max.displayPosition ?? -1) + 1;
    }

    return this.prisma.locationImage.create({
      data: {
        locationId,
        storageUrl: dto.storageUrl,
        filePath: dto.filePath,
        altText: dto.altText,
        displayPosition: dto.displayPosition,
        size: dto.size || 'medium',
      },
    });
  }

  /**
   * 更新據點圖片
   */
  async updateImage(
    locationId: string,
    imageId: string,
    dto: UpdateLocationImageDto,
  ) {
    // 確認圖片存在
    const image = await this.prisma.locationImage.findFirst({
      where: { id: imageId, locationId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    return this.prisma.locationImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  /**
   * 刪除據點圖片
   */
  async removeImage(locationId: string, imageId: string) {
    // 確認圖片存在並取得檔案路徑
    const image = await this.prisma.locationImage.findFirst({
      where: { id: imageId, locationId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    // 從 Supabase Storage 刪除檔案
    try {
      await this.supabase.deleteFile(LOCATION_IMAGES_BUCKET, image.filePath);
    } catch (error) {
      // 檔案可能不存在，記錄但不阻止刪除記錄
      console.warn(
        `Failed to delete file from storage: ${image.filePath}`,
        error,
      );
    }

    // 刪除資料庫記錄
    await this.prisma.locationImage.delete({
      where: { id: imageId },
    });

    return { message: '圖片已刪除' };
  }

  /**
   * 重新排序圖片
   */
  async reorderImages(locationId: string, imageIds: string[]) {
    // 確認據點存在
    await this.findOne(locationId);

    // 批次更新排序
    const updates = imageIds.map((id, index) =>
      this.prisma.locationImage.updateMany({
        where: { id, locationId },
        data: { displayPosition: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // 回傳更新後的圖片列表
    return this.prisma.locationImage.findMany({
      where: { locationId },
      orderBy: { displayPosition: 'asc' },
    });
  }

  /**
   * 取得據點的所有圖片
   */
  async getImages(locationId: string) {
    // 確認據點存在
    await this.findOne(locationId);

    return this.prisma.locationImage.findMany({
      where: { locationId },
      orderBy: { displayPosition: 'asc' },
    });
  }
}
