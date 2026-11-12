import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: '操作者 ID' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiPropertyOptional({ description: '資源類型，如 products、orders' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resource?: string;

  @ApiPropertyOptional({ description: '動作，如 CREATE、UPDATE、DELETE' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  action?: string;

  @ApiPropertyOptional({
    description: '開始日期（台灣時間，含當天）',
    example: '2026-11-01',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'from 必須是 YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({
    description: '結束日期（台灣時間，含當天）',
    example: '2026-11-30',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'to 必須是 YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ description: '每頁筆數', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: '跳過筆數', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
