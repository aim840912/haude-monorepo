import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum ScheduleStatus {
  upcoming = 'upcoming',
  ongoing = 'ongoing',
  completed = 'completed',
  cancelled = 'cancelled',
}

export class CreateScheduleDto {
  @IsString()
  title: string;

  @IsString()
  location: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string; // e.g., "06:00-12:00"

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  specialOffer?: string;

  @IsOptional()
  @IsString()
  weatherNote?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
