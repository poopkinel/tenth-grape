import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipsService } from '../friendships/friendships.service';

interface PlayerSuggestion {
  id: string;
  name: string;
  avatar: string | null;
  distanceKm: number;
  gameOverlapCount: number;
  gamingFrequency: string | null;
}

@Injectable()
export class SuggestionsService {
  constructor(
    private prisma: PrismaService,
    private friendships: FriendshipsService,
  ) {}

  /**
   * Find players near the viewer who have a specific game in their library.
   * Ranked by distance then by total game overlap with the viewer.
   */
  async playersForGame(userId: string, bggId: number, radiusKm: number, limit: number) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true },
    });
    if (!me?.lat || !me?.lng) return [];

    // Don't suggest self or existing friends
    const friendIds = await this.friendships.friendIds(userId);
    const excludeIds = [userId, ...friendIds];

    const rows: PlayerSuggestion[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        u.id,
        u.name,
        u.avatar,
        p."gamingFrequency" AS "gamingFrequency",
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(u.lat))
            * cos(radians(u.lng) - radians($2))
            + sin(radians($1)) * sin(radians(u.lat))
          )
        ) AS "distanceKm",
        (
          SELECT COUNT(*)::int FROM user_games ug1
          INNER JOIN user_games ug2 ON ug1."bggId" = ug2."bggId"
          WHERE ug1."userId" = u.id AND ug2."userId" = $3
        ) AS "gameOverlapCount"
      FROM users u
      INNER JOIN user_games ug ON ug."userId" = u.id AND ug."bggId" = $4
      LEFT JOIN profiles p ON p."userId" = u.id
      WHERE u.lat IS NOT NULL
        AND u.lng IS NOT NULL
        AND u.id != ALL($5::text[])
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(u.lat))
            * cos(radians(u.lng) - radians($2))
            + sin(radians($1)) * sin(radians(u.lat))
          )
        ) <= $6
      ORDER BY "distanceKm" ASC, "gameOverlapCount" DESC
      LIMIT $7
      `,
      me.lat,
      me.lng,
      userId,
      bggId,
      excludeIds,
      radiusKm,
      limit,
    );

    return rows.map((r) => ({
      ...r,
      distanceKm: Math.round(r.distanceKm * 10) / 10,
    }));
  }

  /**
   * Suggest players to invite to an event. We rank by:
   *   - Distance from event location
   *   - Overlap with the event's linked games (via any posts that mention the event)
   *   - Excludes users already RSVP'd to the event
   *
   * For MVP we just use distance from the event location; game overlap is
   * deferred until events can declare associated games.
   */
  async playersForEvent(userId: string, eventId: string, limit: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { lat: true, lng: true, attendees: { select: { userId: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    const excludeIds = [userId, ...event.attendees.map((a) => a.userId)];

    const rows: PlayerSuggestion[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        u.id,
        u.name,
        u.avatar,
        p."gamingFrequency" AS "gamingFrequency",
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(u.lat))
            * cos(radians(u.lng) - radians($2))
            + sin(radians($1)) * sin(radians(u.lat))
          )
        ) AS "distanceKm",
        0 AS "gameOverlapCount"
      FROM users u
      LEFT JOIN profiles p ON p."userId" = u.id
      WHERE u.lat IS NOT NULL
        AND u.lng IS NOT NULL
        AND u.id != ALL($3::text[])
      ORDER BY "distanceKm" ASC
      LIMIT $4
      `,
      event.lat,
      event.lng,
      excludeIds,
      limit,
    );

    return rows.map((r) => ({
      ...r,
      distanceKm: Math.round(r.distanceKm * 10) / 10,
    }));
  }

  /**
   * Suggest groups whose existing members have strong game overlap with the
   * viewer. Excludes groups the viewer is already a member of.
   */
  async groupsForUser(userId: string, limit: number) {
    // Get the viewer's game library (bggIds)
    const myGames = await this.prisma.userGame.findMany({
      where: { userId },
      select: { bggId: true },
    });
    const myBggIds = myGames.map((g) => g.bggId);

    if (myBggIds.length === 0) {
      // No library — return most-recently-active groups as a fallback
      const recent = await this.prisma.group.findMany({
        where: { NOT: { members: { some: { userId } } } },
        include: { _count: { select: { members: true } } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
      return recent.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        coverImage: g.coverImage,
        memberCount: g._count.members,
        createdAt: g.createdAt.toISOString(),
        overlapScore: 0,
      }));
    }

    type Row = {
      id: string;
      name: string;
      description: string | null;
      coverImage: string | null;
      memberCount: bigint;
      overlapScore: bigint;
    };

    const rows: Row[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g."coverImage",
        (SELECT COUNT(*) FROM group_members gm WHERE gm."groupId" = g.id) AS "memberCount",
        (
          SELECT COUNT(DISTINCT ug."bggId")
          FROM group_members gm
          INNER JOIN user_games ug ON ug."userId" = gm."userId"
          WHERE gm."groupId" = g.id
            AND ug."bggId" = ANY($1::int[])
        ) AS "overlapScore"
      FROM groups g
      WHERE g.id NOT IN (
        SELECT "groupId" FROM group_members WHERE "userId" = $2
      )
      ORDER BY "overlapScore" DESC, "memberCount" DESC
      LIMIT $3
      `,
      myBggIds,
      userId,
      limit,
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      coverImage: r.coverImage,
      memberCount: Number(r.memberCount),
      createdAt: null, // not returned by the raw query; not critical for suggestion cards
      overlapScore: Number(r.overlapScore),
    }));
  }
}
