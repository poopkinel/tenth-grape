import { GroupRole } from '../enums';

export interface GroupMemberDto {
  userId: string;
  name: string;
  avatar: string | null;
  role: GroupRole;
  joinedAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  memberCount: number;
  createdAt: string;
}

export interface GroupDetailDto extends GroupDto {
  members: GroupMemberDto[];
  /** Current user's role, or null if not a member */
  myRole: GroupRole | null;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  coverImage?: string;
}

export interface InviteToGroupDto {
  userIds: string[];
}
