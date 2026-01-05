import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max } from 'class-validator';

/**
 * 新增商品到購物車
 */
export class AddCartItemDto {
  @ApiProperty({ description: '產品 ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: '數量', minimum: 1, maximum: 99, default: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;
}

/**
 * 更新購物車商品數量
 */
export class UpdateCartItemDto {
  @ApiProperty({ description: '數量', minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}
