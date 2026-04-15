import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { GameOwnership } from '@prisma/client';

export class AddGameDto {
  @IsInt()
  bggId: number;

  @IsEnum(GameOwnership)
  ownership: GameOwnership;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  personalRating?: number;
}
