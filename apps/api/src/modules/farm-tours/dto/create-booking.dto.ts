import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tourId: string;

  @IsNumber()
  @Min(1)
  participants: number;

  @IsString()
  contactName: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
