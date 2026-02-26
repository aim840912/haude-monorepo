import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertSiteSettingDto {
  @ApiProperty({
    description: '設定值',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: '設定類型',
    enum: ['string', 'number', 'boolean', 'json', 'image', 'images_array'],
    default: 'string',
  })
  @IsEnum(['string', 'number', 'boolean', 'json', 'image', 'images_array'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '設定描述' })
  @IsString()
  @IsOptional()
  description?: string;
}
