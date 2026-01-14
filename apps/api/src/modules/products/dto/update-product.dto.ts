import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

/**
 * 更新產品 DTO
 *
 * 注意：PartialType 會繼承 CreateProductDto 的所有驗證器，包括 @IsNotEmpty()。
 * 對於 description 和 category，我們需要允許空字串（用戶可能清空這些欄位），
 * 因此使用 OmitType 排除這些欄位，再重新定義時不加 @IsNotEmpty()。
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['description', 'category'] as const),
) {
  @ApiPropertyOptional({ description: '產品描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '產品分類' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '是否為草稿', example: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
