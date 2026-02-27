import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteImageFileDto {
  @ApiProperty({
    description: '要刪除的 Storage 檔案路徑',
    example: 'home/hero_images/abc123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}
