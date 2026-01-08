import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: '使用者電子郵件' })
  @IsEmail({}, { message: '請輸入有效的電子郵件' })
  @IsNotEmpty({ message: '電子郵件為必填' })
  email: string;
}
