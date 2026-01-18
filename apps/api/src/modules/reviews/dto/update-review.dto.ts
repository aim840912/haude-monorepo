import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
} from 'class-validator';

/**
 * 更新評論 DTO（用戶）
 */
export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  content?: string;
}

/**
 * 管理員審核評論 DTO
 */
export class ApproveReviewDto {
  @IsBoolean()
  isApproved: boolean;
}
