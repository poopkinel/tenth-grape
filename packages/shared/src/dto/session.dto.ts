import { SessionParticipantStatus } from '../enums';

export interface SessionDto {
  id: string;
  hostId: string;
  bggId: number | null;
  title: string;
  scheduledAt: string;
  locationText: string;
  lat: number;
  lng: number;
  maxPlayers: number;
  description: string | null;
  participants: SessionParticipantDto[];
}

export interface SessionParticipantDto {
  userId: string;
  name: string;
  avatar: string | null;
  status: SessionParticipantStatus;
}

export interface CreateSessionDto {
  bggId?: number;
  title: string;
  scheduledAt: string;
  locationText: string;
  lat: number;
  lng: number;
  maxPlayers: number;
  description?: string;
  inviteMatchIds?: string[];
}
