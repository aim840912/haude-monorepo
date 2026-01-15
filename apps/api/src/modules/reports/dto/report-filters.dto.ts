import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReportFiltersDto {
  @ApiProperty({ description: '開始日期', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '結束日期', example: '2026-01-15' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: '時間分組',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: '對比模式：yoy=年同比, mom=月環比, wow=週環比',
    enum: ['yoy', 'mom', 'wow'],
  })
  @IsOptional()
  @IsEnum(['yoy', 'mom', 'wow'])
  compareMode?: 'yoy' | 'mom' | 'wow';
}

export class SalesDetailFiltersDto extends ReportFiltersDto {
  @ApiPropertyOptional({ description: '每頁筆數', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '跳過筆數', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
