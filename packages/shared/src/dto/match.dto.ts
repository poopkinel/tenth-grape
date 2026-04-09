import { MatchStatus } from '../enums';
import { UserDto } from './user.dto';

export interface MatchDto {
  id: string;
  otherUser: { id: string; name: string; avatar: string | null };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  createdAt: string;
}

export interface DiscoveryUserDto {
  id: string;
  name: string;
  avatar: string | null;
  distanceKm: number;
  gameOverlapCount: number;
  sharedGames: { bggId: number; title: string }[];
  gamingFrequency: string;
}
