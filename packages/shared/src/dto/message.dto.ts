export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
}
