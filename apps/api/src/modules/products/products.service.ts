import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有啟用的產品（公開 API）
   */
  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: {
          orderBy: { displayPosition: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 取得所有產品（管理員用，含下架產品）
   */
  async findAllAdmin() {
    return this.prisma.product.findMany({
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

    await this.prisma.product.delete({ where: { id } });

    return { message: '產品已刪除' };
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
}
