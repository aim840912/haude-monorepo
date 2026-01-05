import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: '產品名稱', example: '有機草莓' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '產品描述', example: '新鮮採摘的有機草莓' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '產品分類', example: '水果' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '價格', example: 300 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '價格單位', example: '盒' })
  @IsOptional()
  @IsString()
  priceUnit?: string;

  @ApiPropertyOptional({ description: '單位數量', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitQuantity?: number;

  @ApiPropertyOptional({ description: '原價（促銷用）', example: 350 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: '是否特價中', example: false })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ApiPropertyOptional({
    description: '特價結束日期',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiProperty({ description: '庫存數量', example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: '是否啟用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
