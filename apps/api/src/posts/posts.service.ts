import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

/** Standard include for fetching a post with everything the feed needs */
const POST_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true } },
  games: {
    include: { game: { select: { bggId: true, title: true, thumbnail: true } } },
    orderBy: { order: 'asc' as const },
  },
  reactions: { select: { emoji: true, userId: true } },
  _count: { select: { comments: true } },
};

type PostWithIncludes = Awaited<ReturnType<PostsService['loadPost']>>;

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  /** Fetch a single post by id with all includes; null if not found */
  private async loadPost(postId: string) {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: POST_INCLUDE,
    });
  }

  async create(authorId: string, dto: CreatePostDto) {
    const { bggIds, ...rest } = dto;

    // If linking to a group, user must be a member
    if (rest.linkedGroupId) {
      const member = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: rest.linkedGroupId, userId: authorId },
        },
      });
      if (!member) throw new ForbiddenException('Not a member of that group');
    }

    const post = await this.prisma.post.create({
      data: {
        ...rest,
        photos: rest.photos ?? [],
        authorId,
        games: bggIds?.length
          ? { create: bggIds.map((bggId, i) => ({ bggId, order: i })) }
          : undefined,
      },
      include: POST_INCLUDE,
    });

    return this.format(post, authorId);
  }

  async getById(postId: string, viewerId: string) {
    const post = await this.loadPost(postId);
    if (!post) throw new NotFoundException('Post not found');
    return this.format(post, viewerId);
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('Only the author can delete this post');
    }
    await this.prisma.post.delete({ where: { id: postId } });
  }

  // ─── Reactions ──────────────────────────────────────────────────────────────

  async react(postId: string, userId: string, emoji: string) {
    await this.ensurePostExists(postId);
    return this.prisma.reaction.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId, emoji },
      update: { emoji },
    });
  }

  async unreact(postId: string, userId: string) {
    await this.prisma.reaction.deleteMany({ where: { postId, userId } });
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  async getComments(postId: string) {
    await this.ensurePostExists(postId);
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      author: c.author,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async addComment(postId: string, authorId: string, dto: CreateCommentDto) {
    await this.ensurePostExists(postId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content,
        parentId: dto.parentId ?? null,
      },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    return {
      id: comment.id,
      postId: comment.postId,
      author: comment.author,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can delete this comment');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
  }

  /**
   * Shape a Prisma post row into the feed-ready PostDto format.
   * Aggregates reactions by emoji and computes whether the viewer reacted.
   */
  format(post: NonNullable<PostWithIncludes>, viewerId: string) {
    const reactionMap = new Map<string, { count: number; mine: boolean }>();
    for (const r of post.reactions) {
      const entry = reactionMap.get(r.emoji) ?? { count: 0, mine: false };
      entry.count++;
      if (r.userId === viewerId) entry.mine = true;
      reactionMap.set(r.emoji, entry);
    }

    return {
      id: post.id,
      author: post.author,
      type: post.type,
      content: post.content,
      photos: post.photos,
      games: post.games.map((pg) => ({
        bggId: pg.game.bggId,
        title: pg.game.title,
        thumbnail: pg.game.thumbnail,
      })),
      linkedSessionId: post.linkedSessionId,
      linkedEventId: post.linkedEventId,
      linkedGroupId: post.linkedGroupId,
      reactions: Array.from(reactionMap.entries()).map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine,
      })),
      commentCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
    };
  }

  /** Convenience for other modules (feed, sessions) to format bulk posts */
  async formatMany(postIds: string[], viewerId: string) {
    if (postIds.length === 0) return [];
    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.format(p, viewerId));
  }
}
