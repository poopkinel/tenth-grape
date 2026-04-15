import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { PostType, SessionParticipantStatus, SessionStatus } from '@prisma/client';

const SESSION_INCLUDE = {
  host: { select: { id: true, name: true, avatar: true } },
  games: {
    include: { game: { select: { bggId: true, title: true, thumbnail: true } } },
    orderBy: { order: 'asc' as const },
  },
  participants: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
  },
};

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(hostId: string, dto: CreateSessionDto) {
    const { inviteUserIds, scheduledAt, bggIds, ...rest } = dto;

    const session = await this.prisma.session.create({
      data: {
        ...rest,
        scheduledAt: new Date(scheduledAt),
        hostId,
        participants: {
          create: [
            { userId: hostId, status: SessionParticipantStatus.ACCEPTED },
            ...(inviteUserIds ?? [])
              .filter((id) => id !== hostId)
              .map((userId) => ({
                userId,
                status: SessionParticipantStatus.INVITED,
              })),
          ],
        },
        games: bggIds?.length
          ? {
              create: bggIds.map((bggId, i) => ({ bggId, order: i })),
            }
          : undefined,
      },
      include: SESSION_INCLUDE,
    });

    return session;
  }

  async getById(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: SESSION_INCLUDE,
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getMySessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
        scheduledAt: { gte: new Date() },
      },
      include: SESSION_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    const sessions: { id: string }[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT s.id
      FROM sessions s
      WHERE s."scheduledAt" >= NOW()
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(s.lat))
            * cos(radians(s.lng) - radians($2))
            + sin(radians($1)) * sin(radians(s.lat))
          )
        ) <= $3
      ORDER BY s."scheduledAt" ASC
      LIMIT 50
      `,
      lat,
      lng,
      radiusKm,
    );

    if (sessions.length === 0) return [];

    return this.prisma.session.findMany({
      where: { id: { in: sessions.map((s) => s.id) } },
      include: SESSION_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async rsvp(sessionId: string, userId: string, status: SessionParticipantStatus) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    if (status === SessionParticipantStatus.ACCEPTED) {
      const acceptedCount = await this.prisma.sessionParticipant.count({
        where: { sessionId, status: SessionParticipantStatus.ACCEPTED },
      });
      if (acceptedCount >= session.maxPlayers) {
        throw new ForbiddenException('Session is full');
      }
    }

    return this.prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId, status },
      update: { status },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async cancel(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.hostId !== userId) {
      throw new ForbiddenException('Only the host can cancel a session');
    }

    await this.prisma.session.delete({ where: { id: sessionId } });
  }

  /**
   * Mark a session as COMPLETED, attach photos/notes/winners, and auto-create
   * a PLAY_LOG post so it appears in participants' feeds.
   */
  async complete(sessionId: string, userId: string, dto: CompleteSessionDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { games: true, participants: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.hostId !== userId) {
      throw new ForbiddenException('Only the host can complete a session');
    }
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session already completed');
    }

    // Validate winner bggIds belong to the session
    const sessionBggIds = new Set(session.games.map((g) => g.bggId));
    if (dto.winners) {
      for (const bggIdStr of Object.keys(dto.winners)) {
        if (!sessionBggIds.has(parseInt(bggIdStr, 10))) {
          throw new BadRequestException(
            `Winner specified for bggId ${bggIdStr} which is not in this session`,
          );
        }
      }
    }

    // Validate participant userIds belong to the session
    const participantUserIds = new Set(session.participants.map((p) => p.userId));
    for (const r of dto.participantResults ?? []) {
      if (!participantUserIds.has(r.userId)) {
        throw new BadRequestException(
          `Participant result for user ${r.userId} who is not in this session`,
        );
      }
    }

    // Do it all in a transaction so the post is guaranteed to match session state
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update session
      await tx.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
          photos: dto.photos ?? [],
          notes: dto.notes ?? null,
        },
      });

      // 2. Winners per game
      if (dto.winners) {
        for (const [bggIdStr, winnerId] of Object.entries(dto.winners)) {
          await tx.sessionGame.update({
            where: {
              sessionId_bggId: { sessionId, bggId: parseInt(bggIdStr, 10) },
            },
            data: { winnerId },
          });
        }
      }

      // 3. Participant results (position/score/won)
      for (const r of dto.participantResults ?? []) {
        await tx.sessionParticipant.update({
          where: { sessionId_userId: { sessionId, userId: r.userId } },
          data: {
            position: r.position ?? null,
            score: r.score ?? null,
            won: r.won ?? false,
          },
        });
      }

      // 4. Auto-generate PLAY_LOG post linked to this session
      await tx.post.create({
        data: {
          authorId: userId,
          type: PostType.PLAY_LOG,
          content: dto.notes ?? null,
          photos: dto.photos ?? [],
          linkedSessionId: sessionId,
          games: session.games.length
            ? {
                create: session.games.map((g) => ({
                  bggId: g.bggId,
                  order: g.order,
                })),
              }
            : undefined,
        },
      });

      return tx.session.findUnique({
        where: { id: sessionId },
        include: SESSION_INCLUDE,
      });
    });

    return updated;
  }
}
