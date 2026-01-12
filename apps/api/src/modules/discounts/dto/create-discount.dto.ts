import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator'
import { DiscountType } from '@prisma/client'

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  code: string // 折扣碼（會自動轉大寫）

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(DiscountType)
  discountType: DiscountType

  @IsInt()
  @Min(1)
  discountValue: number // 百分比(1-100) 或 固定金額

  @IsInt()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number // 最低訂單金額

  @IsInt()
  @IsOptional()
  @Min(0)
  maxDiscount?: number // 最高折扣金額（百分比折扣用）

  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number // 總使用次數限制

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  perUserLimit?: number // 每人使用次數

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
