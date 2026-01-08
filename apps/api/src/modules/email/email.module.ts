import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // 全域模組，不需要在每個模組 import
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
