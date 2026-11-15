import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Only the shape getImageUploadUrl produces: `<key path>/<uuid>.<image ext>`.
 * Anything else (`..`, other names, other extensions) is not ours to delete.
 */
const UPLOADED_IMAGE_PATH =
  /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif)$/i;

export class DeleteImageFileDto {
  @ApiProperty({
    description: '要刪除的 Storage 檔案路徑（上傳時產生的格式）',
    example: 'home/hero_images/0b9a7c3e-1f2d-4e5a-9b8c-7d6e5f4a3b2c.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(UPLOADED_IMAGE_PATH, { message: '檔案路徑格式不正確' })
  filePath: string;
}
