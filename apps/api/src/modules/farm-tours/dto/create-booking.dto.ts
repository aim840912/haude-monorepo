import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tourId: string;

  // Whole people only; capacity is enforced against the tour, Max is a sanity bound.
  @IsInt()
  @Min(1)
  @Max(100)
  participants: number;

  @IsString()
  contactName: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
