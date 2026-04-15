import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BggService, BggSearchResult } from './bgg.service';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private bgg: BggService,
  ) {}

  /**
   * Hybrid search: local catalog (~17k games) first, then BGG API as fallback
   * if a token is configured and local returns nothing.
   */
  async search(query: string): Promise<BggSearchResult[]> {
    const local = await this.prisma.game.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 25,
      orderBy: { title: 'asc' },
    });

    if (local.length > 0) {
      return local.map((g) => ({
        bggId: g.bggId,
        title: g.title,
        yearPublished: null,
        thumbnail: g.thumbnail,
      } as BggSearchResult & { thumbnail: string | null }));
    }

    // Fall back to BGG only if token is available
    if (this.bgg.isAvailable()) {
      return this.bgg.search(query);
    }
    return [];
  }

  async getGame(bggId: number) {
    const cached = await this.prisma.game.findUnique({ where: { bggId } });
    if (cached) return cached;

    // Not in local catalog — try BGG fallback
    const detail = await this.bgg.getGameDetail(bggId);
    if (!detail) {
      throw new NotFoundException(
        `Game ${bggId} not in local catalog. BGG fallback unavailable (no token or BGG error).`,
      );
    }

    return this.prisma.game.upsert({
      where: { bggId },
      create: detail,
      update: detail,
    });
  }
}
