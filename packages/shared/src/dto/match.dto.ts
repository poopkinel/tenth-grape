import { MatchStatus } from '../enums';
import { UserDto } from './user.dto';

export interface MatchDto {
  id: string;
  status: MatchStatus;
  otherUser: UserDto & { gameOverlapCount: number };
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
