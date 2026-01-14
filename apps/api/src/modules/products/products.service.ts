import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductImageDto,
  UpdateProductImageDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket 名稱
const PRODUCT_IMAGES_BUCKET = 'product-images';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有啟用的產品（公開 API，排除草稿）
   */
  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true, isDraft: false },
      include: {
        images: {
          orderBy: { displayPosition: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 取得所有產品（管理員用，含下架產品，預設排除草稿）
   */
  async findAllAdmin(includeDrafts = false) {
    return this.prisma.product.findMany({
      where: includeDrafts ? {} : { isDraft: false },
      include: {
        images: {
          orderBy: { displayPosition: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 取得單一產品
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { displayPosition: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`產品不存在: ${id}`);
    }

    return product;
  }

  /**
   * 取得產品分類列表
   */
  async getCategories(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return products.map((p) => p.category).sort();
  }

  /**
   * 檢查產品名稱是否已存在
   */
  async checkNameExists(
    name: string,
    excludeId?: string,
  ): Promise<{ exists: boolean; name: string }> {
    const product = await this.prisma.product.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return { exists: !!product, name };
  }

  /**
   * 取得庫存狀態
   */
  async getInventoryStatus(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException(`產品不存在: ${productId}`);
    }

    const available = product.stock - product.reservedStock;

    return {
      stock: product.stock,
      reserved: product.reservedStock,
      available,
      canPurchase: available > 0,
      reservedPercentage:
        product.stock > 0
          ? Math.round((product.reservedStock / product.stock) * 100 * 100) /
            100
          : 0,
    };
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 建立草稿產品（用於新增時先取得 productId）
   */
  async createDraft() {
    return this.prisma.product.create({
      data: {
        name: '新產品',
        description: '',
        category: '未分類',
        price: 0,
        stock: 0,
        isActive: false,
        isDraft: true,
      },
      include: { images: true },
    });
  }

  /**
   * 建立產品
   */
  async create(dto: CreateProductDto) {
    const data: Prisma.ProductCreateInput = {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      price: dto.price,
      priceUnit: dto.priceUnit,
      unitQuantity: dto.unitQuantity,
      originalPrice: dto.originalPrice,
      isOnSale: dto.isOnSale ?? false,
      saleEndDate: dto.saleEndDate ? new Date(dto.saleEndDate) : null,
      stock: dto.stock,
      isActive: dto.isActive ?? true,
    };

    return this.prisma.product.create({
      data,
      include: { images: true },
    });
  }

  /**
   * 更新產品
   */
  async update(id: string, dto: UpdateProductDto) {
    // 確認產品存在
    await this.findOne(id);

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.priceUnit !== undefined) data.priceUnit = dto.priceUnit;
    if (dto.unitQuantity !== undefined) data.unitQuantity = dto.unitQuantity;
    if (dto.originalPrice !== undefined) data.originalPrice = dto.originalPrice;
    if (dto.isOnSale !== undefined) data.isOnSale = dto.isOnSale;
    if (dto.saleEndDate !== undefined) {
      data.saleEndDate = dto.saleEndDate ? new Date(dto.saleEndDate) : null;
    }
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isDraft !== undefined) data.isDraft = dto.isDraft;

    return this.prisma.product.update({
      where: { id },
      data,
      include: { images: true },
    });
  }

  /**
   * 刪除產品
   */
  async remove(id: string) {
    // 確認產品存在
    await this.findOne(id);

    try {
      await this.prisma.product.delete({ where: { id } });
      return { message: '產品已刪除' };
    } catch (error) {
      // 處理外鍵約束錯誤（產品被訂單引用）
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          '此產品已有訂單記錄，無法刪除。建議改用「下架」功能。',
        );
      }
      throw error;
    }
  }

  /**
   * 軟刪除產品（設為非啟用）
   */
  async softRemove(id: string) {
    // 確認產品存在
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========================================
  // 圖片管理方法（Image Operations）
  // ========================================

  /**
   * 取得簽名上傳 URL（讓前端直傳到 Supabase Storage）
   */
  async getUploadUrl(productId: string, fileName: string) {
    // 確認產品存在
    await this.findOne(productId);

    // 生成唯一檔名，避免覆蓋
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${ext}`;
    const filePath = `${productId}/${uniqueFileName}`;

    const { signedUrl, path } = await this.supabase.createSignedUploadUrl(
      PRODUCT_IMAGES_BUCKET,
      filePath,
    );

    // 取得公開 URL
    const publicUrl = this.supabase.getPublicUrl(PRODUCT_IMAGES_BUCKET, path);

    return {
      uploadUrl: signedUrl,
      filePath: path,
      publicUrl,
    };
  }

  /**
   * 新增產品圖片記錄
   */
  async addImage(productId: string, dto: CreateProductImageDto) {
    // 確認產品存在
    await this.findOne(productId);

    // 如果沒有指定 displayPosition，放到最後
    if (dto.displayPosition === undefined) {
      const maxPosition = await this.prisma.productImage.aggregate({
        where: { productId },
        _max: { displayPosition: true },
      });
      dto.displayPosition = (maxPosition._max.displayPosition ?? -1) + 1;
    }

    return this.prisma.productImage.create({
      data: {
        productId,
        storageUrl: dto.storageUrl,
        filePath: dto.filePath,
        altText: dto.altText,
        displayPosition: dto.displayPosition,
        size: dto.size || 'medium',
      },
    });
  }

  /**
   * 更新產品圖片
   */
  async updateImage(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ) {
    // 確認產品和圖片存在
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  /**
   * 刪除產品圖片
   */
  async removeImage(productId: string, imageId: string) {
    // 確認圖片存在並取得檔案路徑
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`圖片不存在: ${imageId}`);
    }

    // 從 Supabase Storage 刪除檔案
    try {
      await this.supabase.deleteFile(PRODUCT_IMAGES_BUCKET, image.filePath);
    } catch (error) {
      // 檔案可能不存在，記錄但不阻止刪除記錄
      console.warn(`Failed to delete file from storage: ${image.filePath}`, error);
    }

    // 刪除資料庫記錄
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return { message: '圖片已刪除' };
  }

  /**
   * 重新排序圖片
   */
  async reorderImages(productId: string, imageIds: string[]) {
    // 確認產品存在
    await this.findOne(productId);

    // 批次更新排序
    const updates = imageIds.map((id, index) =>
      this.prisma.productImage.updateMany({
        where: { id, productId },
        data: { displayPosition: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // 回傳更新後的圖片列表
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayPosition: 'asc' },
    });
  }

  /**
   * 取得產品的所有圖片
   */
  async getImages(productId: string) {
    // 確認產品存在
    await this.findOne(productId);

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayPosition: 'asc' },
    });
  }
}
