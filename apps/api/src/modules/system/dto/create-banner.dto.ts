import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SystemBannerType } from '@haude/types';

/**
 * 系統公告連結 DTO
 */
class BannerLinkDto {
  @ApiProperty({ description: '連結文字', example: '了解更多' })
  @IsString()
  text: string;

  @ApiProperty({ description: '連結 URL', example: 'https://example.com/info' })
  @IsUrl()
  url: string;
}

/**
 * 建立系統公告的 DTO
 */
export class CreateBannerDto {
  @ApiProperty({
    description: '通知類型',
    enum: ['info', 'warning', 'error', 'maintenance'],
  })
  @IsIn(['info', 'warning', 'error', 'maintenance'])
  type: SystemBannerType;

  @ApiProperty({ description: '通知標題', example: '系統維護通知' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: '通知內容',
    example: '我們將於今晚 10:00 進行系統維護',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: '是否可關閉', default: true })
  @IsOptional()
  @IsBoolean()
  dismissible?: boolean;

  @ApiPropertyOptional({
    description: '過期時間（ISO 8601 格式）',
    example: '2026-01-22T10:00:00Z',
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: '連結', type: BannerLinkDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BannerLinkDto)
  link?: BannerLinkDto;
}
