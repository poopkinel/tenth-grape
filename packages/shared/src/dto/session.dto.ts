import { SessionStatus, SessionParticipantStatus } from '../enums';

export interface SessionGameDto {
  bggId: number;
  title: string;
  thumbnail: string | null;
  order: number;
  winnerId: string | null;
}

export interface SessionParticipantDto {
  userId: string;
  name: string;
  avatar: string | null;
  status: SessionParticipantStatus;
  position: number | null;
  score: number | null;
  won: boolean;
}

export interface SessionDto {
  id: string;
  hostId: string;
  title: string;
  scheduledAt: string;
  locationText: string;
  lat: number;
  lng: number;
  maxPlayers: number;
  description: string | null;
  status: SessionStatus;
  photos: string[];
  notes: string | null;
  completedAt: string | null;
  games: SessionGameDto[];
  participants: SessionParticipantDto[];
}

export interface CreateSessionDto {
  title: string;
  scheduledAt: string;
  locationText: string;
  lat: number;
  lng: number;
  maxPlayers: number;
  description?: string;
  bggIds?: number[];
  inviteUserIds?: string[];
}

export interface CompleteSessionDto {
  photos?: string[];
  notes?: string;
  /** Per-game winner mapping: bggId → userId */
  winners?: Record<number, string>;
  /** Per-participant results */
  participantResults?: Array<{
    userId: string;
    position?: number;
    score?: number;
    won?: boolean;
  }>;
}
