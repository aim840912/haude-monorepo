import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberLevel } from '@prisma/client';

export class AdjustLevelDto {
  @ApiProperty({
    enum: MemberLevel,
    description: '目標會員等級',
    example: 'GOLD',
  })
  @IsEnum(MemberLevel)
  level: MemberLevel;

  @ApiProperty({
    description: '調整原因',
    example: 'VIP 客戶手動升級',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
