import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({
    example: 'mypassword123',
    description: '新密碼（至少 6 個字元）',
  })
  @IsString()
  @IsNotEmpty({ message: '密碼為必填' })
  @MinLength(6, { message: '密碼至少需要 6 個字元' })
  password: string;
}
