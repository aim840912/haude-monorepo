import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustPointsDto {
  @ApiProperty({
    description: '調整積分數量（正數增加，負數扣除）',
    example: 100,
  })
  @IsInt()
  points: number;

  @ApiProperty({
    description: '調整原因',
    example: '客訴補償',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
