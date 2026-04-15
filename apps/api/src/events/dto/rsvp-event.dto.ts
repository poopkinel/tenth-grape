import { IsEnum } from 'class-validator';
import { EventAttendeeStatus } from '@prisma/client';

export class RsvpEventDto {
  @IsEnum(EventAttendeeStatus)
  status: EventAttendeeStatus;
}
