import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetSiteImageUploadUrlDto {
  @ApiProperty({
    description: '設定鍵（用於決定存放路徑）',
    example: 'home.hero_images',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: '檔案名稱',
    example: 'hero-banner.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({
    description: '檔案類型',
    example: 'image/jpeg',
  })
  @IsString()
  @IsOptional()
  contentType?: string;
}
