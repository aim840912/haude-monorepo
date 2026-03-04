import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'USER',
    enum: ['USER', 'VIP', 'STAFF', 'ADMIN'],
    description: 'USER=一般會員, VIP=VIP會員, STAFF=員工, ADMIN=管理員',
  })
  @IsOptional()
  @IsEnum(['USER', 'VIP', 'STAFF', 'ADMIN'], {
    message: 'role 必須是 USER、VIP、STAFF 或 ADMIN',
  })
  role?: 'USER' | 'VIP' | 'STAFF' | 'ADMIN';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
