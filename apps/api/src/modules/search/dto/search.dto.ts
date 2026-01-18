import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: ('product' | 'farmTour' | 'location')[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class SearchSuggestionDto {
  @IsString()
  q: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'farmTour' | 'location';
  url: string;
  category?: string;
  image?: string;
  price?: number;
  rating?: number;
  relevanceScore: number;
}

export interface SearchResponseDto {
  results: SearchResultItem[];
  total: number;
  query: string;
  processingTime: number;
}
