import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123...', description: '重設密碼 Token' })
  @IsString()
  @IsNotEmpty({ message: 'Token 為必填' })
  token: string;

  @ApiProperty({
    example: 'NewPassword123',
    description: '新密碼必須至少 8 個字元，包含大寫字母、小寫字母和數字',
  })
  @IsString()
  @IsNotEmpty({ message: '新密碼為必填' })
  @MinLength(8, { message: '密碼必須至少 8 個字元' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: '密碼必須包含至少一個大寫字母、一個小寫字母和一個數字',
  })
  newPassword: string;
}
