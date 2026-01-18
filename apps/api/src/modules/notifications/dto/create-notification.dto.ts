import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    description: '通知類型',
    example: 'NEW_ORDER',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: '通知標題', example: '新訂單通知' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '通知內容', example: '您收到一筆新訂單 #12345' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: '額外資料',
    example: { orderId: '123', amount: 1500 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '目標使用者 ID（null 表示系統通知）',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
