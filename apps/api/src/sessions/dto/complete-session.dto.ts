import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ParticipantResultDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsInt()
  score?: number;

  @IsOptional()
  @IsBoolean()
  won?: boolean;
}

export class CompleteSessionDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  photos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /** Map of bggId → userId indicating the winner of each game played */
  @IsOptional()
  @IsObject()
  winners?: Record<string, string>;

  @IsOptional()
  @IsArray()
  participantResults?: ParticipantResultDto[];
}
