import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(10)
  bggIds?: number[];

  @IsDateString()
  scheduledAt: string;

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

  @IsInt()
  @Min(2)
  @Max(20)
  maxPlayers: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  inviteUserIds?: string[];
}
