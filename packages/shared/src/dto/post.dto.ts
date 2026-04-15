import { PostType } from '../enums';

export interface PostAuthorDto {
  id: string;
  name: string;
  avatar: string | null;
}

export interface PostGameRefDto {
  bggId: number;
  title: string;
  thumbnail: string | null;
}

export interface ReactionSummaryDto {
  emoji: string;
  count: number;
  /** True if the current viewer reacted with this emoji */
  mine: boolean;
}

export interface CommentDto {
  id: string;
  postId: string;
  author: PostAuthorDto;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface PostDto {
  id: string;
  author: PostAuthorDto;
  type: PostType;
  content: string | null;
  photos: string[];
  games: PostGameRefDto[]; // ordered
  linkedSessionId: string | null;
  linkedEventId: string | null;
  linkedGroupId: string | null;
  reactions: ReactionSummaryDto[];
  commentCount: number;
  createdAt: string;
}

export interface CreatePostDto {
  type: PostType;
  content?: string;
  photos?: string[];
  bggIds?: number[];
  linkedEventId?: string;
  linkedGroupId?: string;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}
