import { IsIn, IsString } from 'class-validator';

/** Constrained to a small set so clients can't spam arbitrary unicode. */
const ALLOWED_EMOJI = ['👍', '❤️', '🎲', '☕', '😂', '🎉'] as const;

export class ReactDto {
  @IsString()
  @IsIn(ALLOWED_EMOJI as unknown as string[])
  emoji: string;
}

export { ALLOWED_EMOJI };
