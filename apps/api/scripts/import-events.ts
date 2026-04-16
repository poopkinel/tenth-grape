/**
 * Bulk import events from a YAML file.
 *
 * Usage: npx tsx scripts/import-events.ts <yaml-path>
 * Example: npx tsx scripts/import-events.ts scripts/events-sample.yaml
 *
 * YAML shape — see scripts/events-sample.yaml for a commented example.
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import * as yaml from 'js-yaml';
import { PrismaClient } from '@prisma/client';
import { BggService } from '../src/games/bgg.service';

interface YamlEvent {
  title: string;
  date: string; // "2026-04-01 19:30" or ISO
  endDate?: string;
  location: string;
  lat?: number;
  lng?: number;
  hostName?: string;
  hostEmail?: string;
  description?: string;
  capacity?: number;
  coverImage?: string;
  externalLink?: string;
  featuredGames?: string[]; // game titles — resolved against the catalog
}

interface YamlRoot {
  defaultHost?: { email: string; name: string };
  defaultLocation?: { lat: number; lng: number };
  events: YamlEvent[];
}

const prisma = new PrismaClient();
const bgg = new BggService();

function parseDate(input: string): Date {
  // Accept "YYYY-MM-DD HH:mm" and full ISO
  const normalized = input.includes('T')
    ? input
    : input.replace(' ', 'T') + (input.length <= 16 ? ':00' : '');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${input}"`);
  return d;
}

/**
 * Resolve a list of game titles to bggIds.
 *
 * Resolution order:
 *   1. Exact match (case-insensitive) against the local Game catalog.
 *   2. Fuzzy `contains` match against the local catalog.
 *   3. BGG API search (requires BGG_TOKEN env var). First hit is fetched,
 *      its full detail cached into the local Game table, and its bggId used.
 *   4. Give up — log a warning and skip the game.
 */
async function resolveGameTitles(titles: string[]): Promise<number[]> {
  const bggIds: number[] = [];
  for (const title of titles) {
    const resolved = await resolveOne(title);
    if (resolved != null) bggIds.push(resolved);
  }
  return bggIds;
}

async function resolveOne(title: string): Promise<number | null> {
  // 1. Exact match
  const exact = await prisma.game.findFirst({
    where: { title: { equals: title, mode: 'insensitive' } },
    select: { bggId: true, title: true },
  });
  if (exact) return exact.bggId;

  // 2. Fuzzy contains match
  const fuzzy = await prisma.game.findFirst({
    where: { title: { contains: title, mode: 'insensitive' } },
    select: { bggId: true, title: true },
    orderBy: { title: 'asc' },
  });
  if (fuzzy) {
    console.warn(`  ! fuzzy match for "${title}" → "${fuzzy.title}" (bggId ${fuzzy.bggId})`);
    return fuzzy.bggId;
  }

  // 3. BGG API fallback (only if token is configured)
  if (!bgg.isAvailable()) {
    console.warn(`  ! no local match for "${title}" and BGG_TOKEN not set — skipped`);
    return null;
  }

  try {
    const results = await bgg.search(title);
    if (results.length === 0) {
      console.warn(`  ! BGG returned no results for "${title}" — skipped`);
      return null;
    }
    const top = results[0];
    const detail = await bgg.getGameDetail(top.bggId);
    if (!detail) {
      console.warn(`  ! BGG detail fetch failed for bggId ${top.bggId} — skipped`);
      return null;
    }

    await prisma.game.upsert({
      where: { bggId: detail.bggId },
      create: detail,
      update: detail,
    });
    console.log(`  + fetched "${detail.title}" from BGG (bggId ${detail.bggId})`);
    return detail.bggId;
  } catch (e: any) {
    console.warn(`  ! BGG fetch error for "${title}": ${e.message} — skipped`);
    return null;
  }
}

async function resolveOrCreateHost(
  hostName: string | undefined,
  hostEmail: string | undefined,
  defaultHost?: { email: string; name: string },
): Promise<string> {
  const email = hostEmail ?? defaultHost?.email;
  const name = hostName ?? defaultHost?.name ?? 'Community Admin';
  if (!email) {
    throw new Error(
      'Neither hostEmail nor defaultHost.email was provided — cannot create event without a host.',
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: null, // no password — only login-as-host is via future admin flow
      profile: { create: {} },
    },
  });
  console.log(`  + created host user ${email} (id ${created.id})`);
  return created.id;
}

async function main() {
  const pathArg = process.argv[2];
  if (!pathArg) {
    console.error('Usage: npx tsx scripts/import-events.ts <yaml-path>');
    process.exit(1);
  }
  const yamlPath = isAbsolute(pathArg) ? pathArg : resolve(process.cwd(), pathArg);

  console.log(`Reading ${yamlPath}...`);
  const raw = readFileSync(yamlPath, 'utf8');
  const doc = yaml.load(raw) as YamlRoot;

  if (!doc || !Array.isArray(doc.events) || doc.events.length === 0) {
    console.error('No events found in YAML file.');
    process.exit(1);
  }

  console.log(`Importing ${doc.events.length} event(s)...\n`);

  let created = 0;
  let skipped = 0;

  for (const [i, ev] of doc.events.entries()) {
    const label = `[${i + 1}/${doc.events.length}] ${ev.title}`;
    console.log(`→ ${label}`);

    try {
      const hostUserId = await resolveOrCreateHost(
        ev.hostName,
        ev.hostEmail,
        doc.defaultHost,
      );

      const lat = ev.lat ?? doc.defaultLocation?.lat;
      const lng = ev.lng ?? doc.defaultLocation?.lng;
      if (lat == null || lng == null) {
        throw new Error(
          'Missing lat/lng (not on event and no defaultLocation in YAML)',
        );
      }

      const featuredBggIds = ev.featuredGames
        ? await resolveGameTitles(ev.featuredGames)
        : [];

      await prisma.event.create({
        data: {
          title: ev.title,
          description: ev.description ?? null,
          locationText: ev.location,
          lat,
          lng,
          startAt: parseDate(ev.date),
          endAt: ev.endDate ? parseDate(ev.endDate) : null,
          capacity: ev.capacity ?? null,
          coverImage: ev.coverImage ?? null,
          externalLink: ev.externalLink ?? null,
          featuredBggIds,
          hostUserId,
          attendees: {
            create: { userId: hostUserId, status: 'GOING' },
          },
        },
      });

      console.log(`  ✓ created (${featuredBggIds.length} featured games)\n`);
      created++;
    } catch (e: any) {
      console.error(`  ✗ failed: ${e.message}\n`);
      skipped++;
    }
  }

  console.log(`Done. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
