import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(10)
  bggIds?: number[];

  @IsOptional()
  @IsString()
  linkedEventId?: string;

  @IsOptional()
  @IsString()
  linkedGroupId?: string;
}
