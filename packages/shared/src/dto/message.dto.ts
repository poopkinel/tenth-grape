export interface MessageDto {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface SendMessageDto {
  matchId: string;
  content: string;
}
