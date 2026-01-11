import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';

/**
 * 付款方式類型
 */
export type PaymentMethodType = 'CREDIT' | 'ATM' | 'CVS';

/**
 * 建立付款請求 DTO
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: '訂單 ID',
    example: 'uuid-xxx-xxx',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    description: '付款方式',
    enum: ['CREDIT', 'ATM', 'CVS'],
    default: 'CREDIT',
    example: 'CREDIT',
  })
  @IsOptional()
  @IsIn(['CREDIT', 'ATM', 'CVS'])
  paymentMethod?: PaymentMethodType;
}
