import { GamingFrequency, GameOwnership } from '../enums';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export interface ProfileDto {
  userId: string;
  bio: string | null;
  gamingFrequency: GamingFrequency;
  languages: string[];
  maxTravelKm: number;
}

export interface UserGameDto {
  bggId: number;
  title: string;
  thumbnail: string | null;
  weight: number;
  ownership: GameOwnership;
  personalRating: number | null;
}

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  gamingFrequency?: GamingFrequency;
  languages?: string[];
  maxTravelKm?: number;
  lat?: number;
  lng?: number;
}
