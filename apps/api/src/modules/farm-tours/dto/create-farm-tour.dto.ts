import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

export enum FarmTourType {
  harvest = 'harvest',
  workshop = 'workshop',
  tour = 'tour',
  tasting = 'tasting',
}

export enum FarmTourStatus {
  upcoming = 'upcoming',
  ongoing = 'ongoing',
  completed = 'completed',
  cancelled = 'cancelled',
}

export class CreateFarmTourDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  maxParticipants: number;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(FarmTourStatus)
  status?: FarmTourStatus;

  @IsOptional()
  @IsEnum(FarmTourType)
  type?: FarmTourType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
