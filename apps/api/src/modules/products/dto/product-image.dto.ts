import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({
    description: '圖片 URL',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  storageUrl: string;

  @ApiProperty({
    description: '儲存路徑',
    example: 'products/abc123/image.jpg',
  })
  @IsString()
  filePath: string;

  @ApiPropertyOptional({ description: '替代文字' })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ description: '排序位置', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayPosition?: number;

  @ApiPropertyOptional({
    description: '圖片尺寸',
    enum: ['thumbnail', 'medium', 'large'],
    default: 'medium',
  })
  @IsEnum(['thumbnail', 'medium', 'large'])
  @IsOptional()
  size?: 'thumbnail' | 'medium' | 'large';
}

export class UpdateProductImageDto {
  @ApiPropertyOptional({ description: '替代文字' })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ description: '排序位置' })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayPosition?: number;
}

export class ReorderImagesDto {
  @ApiProperty({
    description: '圖片 ID 陣列（按新順序排列）',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsString({ each: true })
  imageIds: string[];
}

export class GetUploadUrlDto {
  @ApiProperty({ description: '檔案名稱', example: 'product-photo.jpg' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ description: '檔案類型', example: 'image/jpeg' })
  @IsString()
  @IsOptional()
  contentType?: string;
}
