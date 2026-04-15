import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { FriendshipsService } from '../friendships/friendships.service';

@Injectable()
export class FeedService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
    private friendships: FriendshipsService,
  ) {}

  /**
   * Home feed: reverse-chronological union of
   *   (posts by friends) ∪ (posts by self) ∪ (posts in groups the user belongs to)
   *
   * Cursor pagination: `cursor` is a post id — we return posts with `createdAt`
   * strictly earlier than the cursor's `createdAt`.
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

    return {
      items: formatted,
      nextCursor: formatted.length === limit ? formatted[formatted.length - 1].id : null,
    };
  }
}
