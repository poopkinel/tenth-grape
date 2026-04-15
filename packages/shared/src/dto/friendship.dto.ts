import { FriendshipStatus } from '../enums';

export interface FriendshipDto {
  id: string;
  otherUser: { id: string; name: string; avatar: string | null };
  /** Direction relative to the current user */
  direction: 'outgoing' | 'incoming' | 'mutual';
  status: FriendshipStatus;
  createdAt: string;
}

export interface SendFriendRequestDto {
  toUserId: string;
}
