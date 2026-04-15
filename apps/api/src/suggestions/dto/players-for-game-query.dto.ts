import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Query for `GET /suggestions/players?bggId=<GAME_ID>&radiusKm=...`
 * Returns players near the viewer whose library contains the given game.
 * `bggId` is the BoardGameGeek game identifier, not a player id.
 */
export class PlayersForGameQueryDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  bggId: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
