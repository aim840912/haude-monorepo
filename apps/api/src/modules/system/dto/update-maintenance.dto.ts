import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新維護模式的 DTO
 */
export class UpdateMaintenanceDto {
  @ApiProperty({ description: '是否啟用維護模式' })
  @IsBoolean()
  isMaintenanceMode: boolean;

  @ApiPropertyOptional({ description: '維護訊息' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: '預計結束時間（ISO 8601 格式）',
    example: '2026-01-22T10:00:00Z',
  })
  @IsOptional()
  @IsString()
  estimatedEndTime?: string;

  @ApiPropertyOptional({
    description: '允許存取的角色',
    enum: ['ADMIN', 'STAFF'],
    isArray: true,
    example: ['ADMIN'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['ADMIN', 'STAFF'], { each: true })
  allowedRoles?: ('ADMIN' | 'STAFF')[];
}
