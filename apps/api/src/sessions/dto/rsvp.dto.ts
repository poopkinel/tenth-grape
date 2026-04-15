import { IsEnum } from 'class-validator';
import { SessionParticipantStatus } from '@prisma/client';

export class RsvpDto {
  @IsEnum(SessionParticipantStatus)
  status: SessionParticipantStatus;
}
