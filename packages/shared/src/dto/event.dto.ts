import { EventAttendeeStatus } from '../enums';

export interface EventAttendeeDto {
  userId: string;
  name: string;
  avatar: string | null;
  status: EventAttendeeStatus;
}

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  locationText: string;
  lat: number;
  lng: number;
  startAt: string;
  endAt: string | null;
  capacity: number | null;
  coverImage: string | null;
  host: { id: string; name: string; avatar: string | null } | null;
  attendeeCount: number;
  /** Current user's RSVP status, or null if not RSVP'd */
  myStatus: EventAttendeeStatus | null;
}

export interface EventDetailDto extends EventDto {
  attendees: EventAttendeeDto[];
}

export interface CreateEventDto {
  title: string;
  description?: string;
  locationText: string;
  lat: number;
  lng: number;
  startAt: string;
  endAt?: string;
  capacity?: number;
  coverImage?: string;
}

export interface RsvpEventDto {
  status: EventAttendeeStatus;
}
