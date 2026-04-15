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

type EventWithIncludes = NonNullable<
  Awaited<ReturnType<PrismaService['event']['findUnique']>>
> & {
  host: { id: string; name: string; avatar: string | null } | null;
  attendees: Array<{
    userId: string;
    status: EventAttendeeStatus;
    user: { id: string; name: string; avatar: string | null };
  }>;
};

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(hostUserId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        hostUserId,
        attendees: {
          create: { userId: hostUserId, status: EventAttendeeStatus.GOING },
        },
      },
      include: EVENT_INCLUDE,
    });
  }

  async getById(eventId: string, viewerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: EVENT_INCLUDE,
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.format(event as EventWithIncludes, viewerId, { detailed: true });
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

    return events.map((e) => this.format(e as EventWithIncludes, viewerId));
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
    return events.map((e) => this.format(e as EventWithIncludes, userId));
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

  private format(
    event: EventWithIncludes,
    viewerId: string,
    opts: { detailed?: boolean } = {},
  ) {
    const myAttendance = event.attendees.find((a) => a.userId === viewerId);
    const goingCount = event.attendees.filter(
      (a) => a.status === EventAttendeeStatus.GOING,
    ).length;

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
      host: event.host,
      attendeeCount: goingCount,
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
