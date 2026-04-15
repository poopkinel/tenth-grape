import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send a friend request from `fromUserId` to `toUserId`.
   * If the reverse request already exists (PENDING), this auto-accepts both sides into ACCEPTED.
   */
  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot befriend yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    // If they already sent a request to us → accept both sides
    const reverse = await this.prisma.friendship.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
    });
    if (reverse && reverse.status === FriendshipStatus.PENDING) {
      return this.prisma.friendship.update({
        where: { id: reverse.id },
        data: { status: FriendshipStatus.ACCEPTED },
      });
    }

    // Otherwise upsert a new outgoing request
    return this.prisma.friendship.upsert({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
      create: { fromUserId, toUserId, status: FriendshipStatus.PENDING },
      update: {}, // no-op if already exists
    });
  }

  async accept(friendshipId: string, userId: string) {
    const f = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!f) throw new NotFoundException('Friend request not found');
    if (f.toUserId !== userId) {
      throw new ForbiddenException('Only the recipient can accept');
    }
    if (f.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
    });
  }

  async decline(friendshipId: string, userId: string) {
    const f = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!f) throw new NotFoundException('Friend request not found');
    if (f.toUserId !== userId && f.fromUserId !== userId) {
      throw new ForbiddenException();
    }
    // Either party can delete the pending request
    await this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  /** Unfriend — remove an accepted friendship, both sides. */
  async removeFriend(userId: string, otherUserId: string) {
    await this.prisma.friendship.deleteMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
    });
  }

  async block(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new BadRequestException();
    // Upsert as BLOCKED in the fromUser direction
    return this.prisma.friendship.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherUserId } },
      create: { fromUserId: userId, toUserId: otherUserId, status: FriendshipStatus.BLOCKED },
      update: { status: FriendshipStatus.BLOCKED },
    });
  }

  /** List all accepted friends of a user */
  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return friendships.map((f) => ({
      id: f.id,
      otherUser: f.fromUserId === userId ? f.toUser : f.fromUser,
      direction: 'mutual' as const,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  /** List all pending requests involving this user (both incoming and outgoing) */
  async listRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.PENDING,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((f) => {
      const outgoing = f.fromUserId === userId;
      return {
        id: f.id,
        otherUser: outgoing ? f.toUser : f.fromUser,
        direction: outgoing ? ('outgoing' as const) : ('incoming' as const),
        status: f.status,
        createdAt: f.createdAt.toISOString(),
      };
    });
  }

  /** Return IDs of the user's accepted friends — used by feed, suggestions, etc. */
  async friendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      select: { fromUserId: true, toUserId: true },
    });
    return friendships.map((f) =>
      f.fromUserId === userId ? f.toUserId : f.fromUserId,
    );
  }
}
