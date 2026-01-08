import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123...', description: '重設密碼 Token' })
  @IsString()
  @IsNotEmpty({ message: 'Token 為必填' })
  token: string;

  @ApiProperty({ example: 'newpassword123', description: '新密碼（至少 6 個字元）' })
  @IsString()
  @IsNotEmpty({ message: '新密碼為必填' })
  @MinLength(6, { message: '密碼至少需要 6 個字元' })
  newPassword: string;
}
