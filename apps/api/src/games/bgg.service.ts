import { Injectable, Logger } from '@nestjs/common';

export interface BggSearchResult {
  bggId: number;
  title: string;
  yearPublished: number | null;
  thumbnail?: string | null;
}

export interface BggGameDetail {
  bggId: number;
  title: string;
  description: string | null;
  minPlayers: number;
  maxPlayers: number;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  weight: number;
  thumbnail: string | null;
  categories: string[];
}

@Injectable()
export class BggService {
  private readonly logger = new Logger(BggService.name);
  private readonly baseUrl = 'https://boardgamegeek.com/xmlapi2';

  /** True if a BGG token is configured and we can make authenticated calls. */
  isAvailable(): boolean {
    return Boolean(process.env.BGG_TOKEN);
  }

  private async bggFetch(url: string): Promise<string | null> {
    if (!process.env.BGG_TOKEN) {
      this.logger.warn(`BGG_TOKEN not set, skipping BGG API call: ${url}`);
      return null;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.BGG_TOKEN}` },
    });
    if (!res.ok) {
      this.logger.warn(`BGG API returned ${res.status} for ${url}`);
      return null;
    }
    return res.text();
  }

  async search(query: string): Promise<BggSearchResult[]> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&type=boardgame`;
    const xml = await this.bggFetch(url);
    if (!xml) return [];

    const results: BggSearchResult[] = [];
    const itemRegex = /<item type="boardgame" id="(\d+)">([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const id = parseInt(match[1], 10);
      const block = match[2];
      const nameMatch = block.match(/<name type="primary" value="([^"]*?)"/);
      const yearMatch = block.match(/<yearpublished value="(\d+)"/);

      if (nameMatch) {
        results.push({
          bggId: id,
          title: this.decodeHtmlEntities(nameMatch[1]),
          yearPublished: yearMatch ? parseInt(yearMatch[1], 10) : null,
        });
      }
    }

    return results.slice(0, 25);
  }

  async getGameDetail(bggId: number): Promise<BggGameDetail | null> {
    const url = `${this.baseUrl}/thing?id=${bggId}&stats=1`;
    const xml = await this.bggFetch(url);
    if (!xml) return null;

    const itemMatch = xml.match(/<item type="boardgame"[\s\S]*?<\/item>/);
    if (!itemMatch) return null;

    const block = itemMatch[0];

    const nameMatch = block.match(/<name type="primary"[^>]*value="([^"]*?)"/);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/);
    const minPlayersMatch = block.match(/<minplayers value="(\d+)"/);
    const maxPlayersMatch = block.match(/<maxplayers value="(\d+)"/);
    const minPlaytimeMatch = block.match(/<minplaytime value="(\d+)"/);
    const maxPlaytimeMatch = block.match(/<maxplaytime value="(\d+)"/);
    const weightMatch = block.match(/<averageweight value="([\d.]+)"/);
    const thumbnailMatch = block.match(/<thumbnail>([\s\S]*?)<\/thumbnail>/);

    const categories: string[] = [];
    const catRegex = /<link type="boardgamecategory"[^>]*value="([^"]*?)"/g;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(this.decodeHtmlEntities(catMatch[1]));
    }

    return {
      bggId,
      title: nameMatch ? this.decodeHtmlEntities(nameMatch[1]) : `Game #${bggId}`,
      description: descMatch ? this.decodeHtmlEntities(descMatch[1]).slice(0, 2000) : null,
      minPlayers: minPlayersMatch ? parseInt(minPlayersMatch[1], 10) : 1,
      maxPlayers: maxPlayersMatch ? parseInt(maxPlayersMatch[1], 10) : 4,
      minPlaytime: minPlaytimeMatch ? parseInt(minPlaytimeMatch[1], 10) : null,
      maxPlaytime: maxPlaytimeMatch ? parseInt(maxPlaytimeMatch[1], 10) : null,
      weight: weightMatch ? parseFloat(weightMatch[1]) : 2.5,
      thumbnail: thumbnailMatch ? thumbnailMatch[1].trim() : null,
      categories,
    };
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#10;/g, '\n')
      .replace(/&apos;/g, "'");
  }
}
