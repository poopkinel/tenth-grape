import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /** Verify user belongs to this conversation, return the conversation */
  async validateConversationAccess(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId1 !== userId && conversation.userId2 !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
    return conversation;
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    await this.validateConversationAccess(conversationId, senderId);

    return this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getHistory(conversationId: string, userId: string, cursor?: string, limit = 30) {
    await this.validateConversationAccess(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async markRead(conversationId: string, userId: string) {
    await this.validateConversationAccess(conversationId, userId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  /**
   * Get or create a 1:1 conversation between two users. Called when a user
   * taps a friend to DM them. Conversation is stable (unique on sorted pair).
   */
  async getOrCreateConversation(userId: string, otherUserId: string) {
    const [a, b] = [userId, otherUserId].sort();
    return this.prisma.conversation.upsert({
      where: { userId1_userId2: { userId1: a, userId2: b } },
      create: { userId1: a, userId2: b },
      update: {},
    });
  }

  /**
   * List all conversations the user is part of, with the other user's info
   * and the last message preview. Ordered by most recent activity.
   */
  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: { select: { id: true, name: true, avatar: true } },
        user2: { select: { id: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
    });

    return conversations
      .map((c) => {
        const otherUser = c.userId1 === userId ? c.user2 : c.user1;
        const lastMessage = c.messages[0] ?? null;
        return {
          id: c.id,
          otherUser,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt.toISOString(),
                senderId: lastMessage.senderId,
              }
            : null,
          createdAt: c.createdAt.toISOString(),
          // Sortable timestamp — last message or conversation creation
          _sortAt: lastMessage?.createdAt.getTime() ?? c.createdAt.getTime(),
        };
      })
      .sort((a, b) => b._sortAt - a._sortAt)
      .map(({ _sortAt, ...rest }) => rest);
  }
}
