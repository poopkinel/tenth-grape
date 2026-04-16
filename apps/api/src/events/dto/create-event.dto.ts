import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MaxLength(200)
  locationText: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsUrl()
  externalLink?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(20)
  featuredBggIds?: number[];
}
