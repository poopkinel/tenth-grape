import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class FeedService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
    private friendships: FriendshipsService,
    private eventsService: EventsService,
  ) {}

  /**
   * Home feed: reverse-chronological union of
   *   (posts by friends) ∪ (posts by self) ∪ (posts in groups the user belongs to)
   *
   * Cursor pagination: `cursor` is a post id — we return posts with `createdAt`
   * strictly earlier than the cursor's `createdAt`.
   *
   * When the feed has no posts on the first page (no cursor), we also return
   * an `emptyState` block with nearby upcoming events, open game invitations,
   * and a placeholder for the upcoming marketplace. The mobile app renders
   * a discovery view instead of a bare "nothing here" state.
   */
  async getHomeFeed(userId: string, cursor: string | undefined, limit: number) {
    const friendIds = await this.friendships.friendIds(userId);
    const authorIds = [userId, ...friendIds];

    const myGroupIds = await this.prisma.groupMember
      .findMany({ where: { userId }, select: { groupId: true } })
      .then((rows) => rows.map((r) => r.groupId));

    // Cursor: fetch the cursor post's createdAt to paginate
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorPost = await this.prisma.post.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      cursorDate = cursorPost?.createdAt;
    }

    const posts = await this.prisma.post.findMany({
      where: {
        AND: [
          cursorDate ? { createdAt: { lt: cursorDate } } : {},
          {
            OR: [
              // Posts from self or friends that are NOT in a group
              {
                authorId: { in: authorIds },
                linkedGroupId: null,
              },
              // Posts from ANY author in a group the viewer belongs to
              myGroupIds.length > 0
                ? { linkedGroupId: { in: myGroupIds } }
                : { id: 'never' }, // impossible filter when user has no groups
            ],
          },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formatted = await this.postsService.formatMany(
      posts.map((p) => p.id),
      userId,
    );

    const nextCursor =
      formatted.length === limit ? formatted[formatted.length - 1].id : null;

    // Empty first page → provide discovery content for the mobile app to render
    const isEmptyFirstPage = formatted.length === 0 && !cursor;
    const emptyState = isEmptyFirstPage
      ? await this.buildEmptyState(userId)
      : null;

    return {
      items: formatted,
      nextCursor,
      emptyState,
    };
  }

  private async buildEmptyState(userId: string) {
    const [events, openInvitations] = await Promise.all([
      this.getNearbyEventsForUser(userId),
      this.getOpenInvitations(userId),
    ]);

    return {
      events,
      openInvitations,
      marketplaceComingSoon: true,
    };
  }

  /** Up to 5 upcoming events near the user's saved location. */
  private async getNearbyEventsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true },
    });
    if (!user?.lat || !user?.lng) return [];

    const nearby = await this.eventsService.findNearby(userId, user.lat, user.lng, 50);
    return nearby.slice(0, 5);
  }

  /**
   * Up to 5 planned sessions with open spots that the viewer isn't already in.
   * Returns a lightweight shape tailored for the discovery card.
   */
  private async getOpenInvitations(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        status: 'PLANNED',
        scheduledAt: { gte: new Date() },
      },
      include: {
        host: { select: { id: true, name: true, avatar: true } },
        games: {
          include: {
            game: { select: { bggId: true, title: true, thumbnail: true } },
          },
          orderBy: { order: 'asc' },
        },
        participants: {
          where: { status: 'ACCEPTED' },
          select: { userId: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 25, // over-fetch, then filter
    });

    return sessions
      .filter((s) => !s.participants.some((p) => p.userId === userId))
      .filter((s) => s.participants.length < s.maxPlayers)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        title: s.title,
        scheduledAt: s.scheduledAt.toISOString(),
        locationText: s.locationText,
        host: s.host,
        games: s.games.map((sg) => ({
          bggId: sg.game.bggId,
          title: sg.game.title,
          thumbnail: sg.game.thumbnail,
        })),
        accepted: s.participants.length,
        maxPlayers: s.maxPlayers,
      }));
  }
}
