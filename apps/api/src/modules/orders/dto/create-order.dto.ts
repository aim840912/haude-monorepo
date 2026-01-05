import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 訂單項目 DTO
 */
export class OrderItemDto {
  @ApiProperty({ description: '產品 ID', example: 'uuid-xxx' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: '購買數量', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * 配送地址 DTO
 */
export class ShippingAddressDto {
  @ApiProperty({ description: '收件人姓名', example: '張三' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '聯絡電話', example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: '街道地址',
    example: '台北市信義區信義路五段 100 號',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: '城市', example: '台北市' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: '郵遞區號', example: '110' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ description: '國家', example: '台灣' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: '備註', example: '請勿按門鈴' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * 建立訂單 DTO
 */
export class CreateOrderDto {
  @ApiProperty({
    description: '訂單項目',
    type: [OrderItemDto],
    example: [{ productId: 'uuid-xxx', quantity: 2 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: '配送地址', type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description: '付款方式',
    example: 'CREDIT',
    enum: ['CREDIT', 'VACC', 'CVS', 'WEBATM'],
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '訂單備註', example: '請盡快出貨' })
  @IsOptional()
  @IsString()
  notes?: string;
}
