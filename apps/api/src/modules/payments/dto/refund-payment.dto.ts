import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type RefundTypeInput = 'FULL' | 'PARTIAL';

export class RefundPaymentDto {
  @ApiProperty({ description: '付款 ID' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ description: '退款類型', enum: ['FULL', 'PARTIAL'] })
  @IsEnum(['FULL', 'PARTIAL'])
  type: RefundTypeInput;

  @ApiPropertyOptional({ description: '退款金額（部分退款時必填）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ description: '退款原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmManualRefundDto {
  @ApiPropertyOptional({ description: '備註' })
  @IsOptional()
  @IsString()
  notes?: string;
}
