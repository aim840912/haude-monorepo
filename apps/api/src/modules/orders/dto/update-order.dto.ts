import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * 更新訂單狀態 DTO（管理員用）
 */
export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    description: '訂單狀態',
    enum: OrderStatus,
    example: 'processing',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '物流追蹤號', example: 'TW123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: '備註', example: '已出貨' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: '付款狀態',
    enum: PaymentStatus,
    example: 'paid',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}

/**
 * 取消訂單 DTO
 */
export class CancelOrderDto {
  @ApiPropertyOptional({ description: '取消原因', example: '不想購買了' })
  @IsOptional()
  @IsString()
  reason?: string;
}
