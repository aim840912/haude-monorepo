import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

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
}
