export interface ConversationDto {
  id: string;
  otherUser: { id: string; name: string; avatar: string | null };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  createdAt: string;
}
