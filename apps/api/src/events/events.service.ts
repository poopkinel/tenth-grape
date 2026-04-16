import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventAttendeeStatus } from '@prisma/client';

const EVENT_INCLUDE = {
  host: { select: { id: true, name: true, avatar: true } },
  attendees: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
  },
};

type EventRow = NonNullable<
  Awaited<ReturnType<PrismaService['event']['findUnique']>>
> & {
  host: { id: string; name: string; avatar: string | null } | null;
  attendees: Array<{
    userId: string;
    status: EventAttendeeStatus;
    user: { id: string; name: string; avatar: string | null };
  }>;
};

export interface GameLookup {
  bggId: number;
  title: string;
  thumbnail: string | null;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(hostUserId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        locationText: dto.locationText,
        lat: dto.lat,
        lng: dto.lng,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        capacity: dto.capacity,
        coverImage: dto.coverImage,
        externalLink: dto.externalLink,
        featuredBggIds: dto.featuredBggIds ?? [],
        hostUserId,
        attendees: {
          create: { userId: hostUserId, status: EventAttendeeStatus.GOING },
        },
      },
      include: EVENT_INCLUDE,
    });
    return this.formatOne(event as EventRow, hostUserId);
  }

  async getById(eventId: string, viewerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: EVENT_INCLUDE,
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.formatOne(event as EventRow, viewerId, { detailed: true });
  }

  async findNearby(viewerId: string, lat: number, lng: number, radiusKm: number) {
    const rows: { id: string }[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT e.id
      FROM events e
      WHERE e."startAt" >= NOW()
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(e.lat))
            * cos(radians(e.lng) - radians($2))
            + sin(radians($1)) * sin(radians(e.lat))
          )
        ) <= $3
      ORDER BY e."startAt" ASC
      LIMIT 50
      `,
      lat,
      lng,
      radiusKm,
    );

    if (rows.length === 0) return [];

    const events = await this.prisma.event.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      include: EVENT_INCLUDE,
      orderBy: { startAt: 'asc' },
    });

    return this.formatMany(events as EventRow[], viewerId);
  }

  async listMine(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { hostUserId: userId },
          { attendees: { some: { userId } } },
        ],
        startAt: { gte: new Date() },
      },
      include: EVENT_INCLUDE,
      orderBy: { startAt: 'asc' },
    });
    return this.formatMany(events as EventRow[], userId);
  }

  async rsvp(eventId: string, userId: string, status: EventAttendeeStatus) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { capacity: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (status === EventAttendeeStatus.GOING && event.capacity != null) {
      const goingCount = await this.prisma.eventAttendee.count({
        where: { eventId, status: EventAttendeeStatus.GOING },
      });
      if (goingCount >= event.capacity) {
        throw new ForbiddenException('Event is at capacity');
      }
    }

    return this.prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });
  }

  async cancel(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can cancel');
    }
    await this.prisma.event.delete({ where: { id: eventId } });
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────

  /** Bulk format — fetches all featured games for a list of events in one query. */
  private async formatMany(events: EventRow[], viewerId: string) {
    const allBggIds = Array.from(
      new Set(events.flatMap((e) => e.featuredBggIds ?? [])),
    );
    const gameMap = await this.loadGameMap(allBggIds);
    return events.map((e) => this.shape(e, viewerId, gameMap, {}));
  }

  /** Single-event format — does its own game lookup. */
  private async formatOne(
    event: EventRow,
    viewerId: string,
    opts: { detailed?: boolean } = {},
  ) {
    const gameMap = await this.loadGameMap(event.featuredBggIds ?? []);
    return this.shape(event, viewerId, gameMap, opts);
  }

  private async loadGameMap(bggIds: number[]): Promise<Map<number, GameLookup>> {
    if (bggIds.length === 0) return new Map();
    const games = await this.prisma.game.findMany({
      where: { bggId: { in: bggIds } },
      select: { bggId: true, title: true, thumbnail: true },
    });
    return new Map(games.map((g) => [g.bggId, g]));
  }

  private shape(
    event: EventRow,
    viewerId: string,
    gameMap: Map<number, GameLookup>,
    opts: { detailed?: boolean },
  ) {
    const myAttendance = event.attendees.find((a) => a.userId === viewerId);
    const goingCount = event.attendees.filter(
      (a) => a.status === EventAttendeeStatus.GOING,
    ).length;

    const featuredGames = (event.featuredBggIds ?? [])
      .map((bggId) => gameMap.get(bggId))
      .filter((g): g is GameLookup => !!g);

    const base = {
      id: event.id,
      title: event.title,
      description: event.description,
      locationText: event.locationText,
      lat: event.lat,
      lng: event.lng,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      capacity: event.capacity,
      coverImage: event.coverImage,
      externalLink: event.externalLink,
      host: event.host,
      attendeeCount: goingCount,
      featuredGames,
      myStatus: myAttendance?.status ?? null,
    };

    if (opts.detailed) {
      return {
        ...base,
        attendees: event.attendees.map((a) => ({
          userId: a.userId,
          name: a.user.name,
          avatar: a.user.avatar,
          status: a.status,
        })),
      };
    }
    return base;
  }
}
