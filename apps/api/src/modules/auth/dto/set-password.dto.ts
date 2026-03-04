import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({
    example: 'MyPassword123',
    description: '密碼必須至少 8 個字元，包含大寫字母、小寫字母和數字',
  })
  @IsString()
  @IsNotEmpty({ message: '密碼為必填' })
  @MinLength(8, { message: '密碼必須至少 8 個字元' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: '密碼必須包含至少一個大寫字母、一個小寫字母和一個數字',
  })
  password: string;
}
