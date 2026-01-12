import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateDiscountDto } from './dto/create-discount.dto'
import { UpdateDiscountDto } from './dto/update-discount.dto'
import { DiscountValidationResult } from './dto/validate-discount.dto'
import { DiscountType } from '@prisma/client'

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // Query Operations（查詢方法）
  // ========================================

  /**
   * 取得所有折扣碼（管理員用）
   */
  async findAll(options?: { isActive?: boolean }) {
    const where = options?.isActive !== undefined ? { isActive: options.isActive } : {}

    return this.prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })
  }

  /**
   * 根據 ID 取得折扣碼
   */
  async findById(id: string) {
    const discount = await this.prisma.discountCode.findUnique({
      where: { id },
      include: {
        usages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            order: { select: { id: true, orderNumber: true, totalAmount: true } },
          },
        },
        _count: { select: { usages: true } },
      },
    })

    if (!discount) {
      throw new NotFoundException('找不到此折扣碼')
    }

    return discount
  }

  /**
   * 根據折扣碼驗證並計算折扣
   */
  async validateDiscountCode(
    code: string,
    userId: string,
    subtotal: number,
  ): Promise<DiscountValidationResult> {
    const normalizedCode = code.toUpperCase().trim()

    // 查詢折扣碼
    const discount = await this.prisma.discountCode.findUnique({
      where: { code: normalizedCode },
      include: {
        usages: {
          where: { userId },
        },
      },
    })

    // 驗證折扣碼是否存在
    if (!discount) {
      return { valid: false, message: '折扣碼不存在' }
    }

    // 驗證是否啟用
    if (!discount.isActive) {
      return { valid: false, message: '此折扣碼已停用' }
    }

    // 驗證開始日期
    if (discount.startDate && new Date() < discount.startDate) {
      return { valid: false, message: '此折扣碼尚未開始' }
    }

    // 驗證結束日期
    if (discount.endDate && new Date() > discount.endDate) {
      return { valid: false, message: '此折扣碼已過期' }
    }

    // 驗證總使用次數
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { valid: false, message: '此折扣碼已達使用上限' }
    }

    // 驗證每人使用次數
    if (discount.usages.length >= discount.perUserLimit) {
      return { valid: false, message: '您已達此折扣碼的使用次數上限' }
    }

    // 驗證最低訂單金額
    if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
      return {
        valid: false,
        message: `訂單金額需滿 NT$${discount.minOrderAmount} 才能使用此折扣碼`,
      }
    }

    // 計算折扣金額
    const discountAmount = this.calculateDiscountAmount(discount, subtotal)

    return {
      valid: true,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount,
      code: discount.code,
      description: discount.description || undefined,
    }
  }

  /**
   * 計算折扣金額
   */
  private calculateDiscountAmount(
    discount: { discountType: DiscountType; discountValue: number; maxDiscount: number | null },
    subtotal: number,
  ): number {
    let discountAmount: number

    if (discount.discountType === DiscountType.PERCENTAGE) {
      // 百分比折扣
      discountAmount = Math.floor(subtotal * (discount.discountValue / 100))

      // 如果有最高折扣限制
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount
      }
    } else {
      // 固定金額折扣
      discountAmount = discount.discountValue

      // 折扣不能超過訂單金額
      if (discountAmount > subtotal) {
        discountAmount = subtotal
      }
    }

    return discountAmount
  }

  // ========================================
  // Command Operations（命令方法）
  // ========================================

  /**
   * 建立折扣碼
   */
  async create(dto: CreateDiscountDto) {
    const normalizedCode = dto.code.toUpperCase().trim()

    // 檢查折扣碼是否已存在
    const existing = await this.prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    })

    if (existing) {
      throw new ConflictException('此折扣碼已存在')
    }

    // 驗證百分比折扣值
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('百分比折扣不能超過 100%')
    }

    return this.prisma.discountCode.create({
      data: {
        code: normalizedCode,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    })
  }

  /**
   * 更新折扣碼
   */
  async update(id: string, dto: UpdateDiscountDto) {
    const existing = await this.prisma.discountCode.findUnique({ where: { id } })

    if (!existing) {
      throw new NotFoundException('找不到此折扣碼')
    }

    // 如果更新折扣碼，檢查新碼是否已存在
    if (dto.code) {
      const normalizedCode = dto.code.toUpperCase().trim()
      const codeExists = await this.prisma.discountCode.findFirst({
        where: { code: normalizedCode, NOT: { id } },
      })

      if (codeExists) {
        throw new ConflictException('此折扣碼已存在')
      }
    }

    return this.prisma.discountCode.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.toUpperCase().trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.perUserLimit !== undefined && { perUserLimit: dto.perUserLimit }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    })
  }

  /**
   * 刪除折扣碼
   */
  async delete(id: string) {
    const existing = await this.prisma.discountCode.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    })

    if (!existing) {
      throw new NotFoundException('找不到此折扣碼')
    }

    // 如果已有使用記錄，改為停用而非刪除
    if (existing._count.usages > 0) {
      return this.prisma.discountCode.update({
        where: { id },
        data: { isActive: false },
      })
    }

    return this.prisma.discountCode.delete({ where: { id } })
  }

  /**
   * 應用折扣到訂單（由 OrdersService 呼叫）
   */
  async applyDiscount(code: string, userId: string, orderId: string, discountAmount: number) {
    const discount = await this.prisma.discountCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!discount) {
      throw new NotFoundException('找不到此折扣碼')
    }

    // 使用交易確保資料一致性
    return this.prisma.$transaction(async (tx) => {
      // 建立使用記錄
      await tx.discountUsage.create({
        data: {
          discountCodeId: discount.id,
          userId,
          orderId,
          discountAmount,
        },
      })

      // 增加使用次數
      await tx.discountCode.update({
        where: { id: discount.id },
        data: { usageCount: { increment: 1 } },
      })
    })
  }
}
