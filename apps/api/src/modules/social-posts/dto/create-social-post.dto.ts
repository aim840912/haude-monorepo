import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsUrl,
} from 'class-validator';

export enum SocialPlatform {
  facebook = 'facebook',
  instagram = 'instagram',
}

export class CreateSocialPostDto {
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
