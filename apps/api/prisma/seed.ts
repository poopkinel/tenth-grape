/**
 * One-time BGG catalog seeder.
 *
 * Reads prisma/seed-data/bgg-games.csv (snapshot from github.com/bundickm/BoardGameGeek)
 * and upserts ~17k rows into the Game table. Safe to re-run.
 *
 * Usage: npx tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';

const CSV_PATH = resolve(__dirname, 'seed-data/bgg-games.csv');
const BATCH_SIZE = 500;

const prisma = new PrismaClient();

interface CsvRow {
  id: string;
  name: string;
  description: string;
  image: string;
  min_players: string;
  max_players: string;
  min_play_time: string;
  max_play_time: string;
  weight: string;
}

function toInt(s: string, fallback: number): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(s: string, fallback: number): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .slice(0, 2000);
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(`CSV not found at ${CSV_PATH}`);
    console.error(`Download it first: curl -o prisma/seed-data/bgg-games.csv \\`);
    console.error(`  https://raw.githubusercontent.com/bundickm/BoardGameGeek/master/games_all.csv`);
    process.exit(1);
  }

  console.log(`Reading ${CSV_PATH}...`);

  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_quotes: true }),
  );

  let batch: ReturnType<typeof toGameRecord>[] = [];
  let imported = 0;
  let skipped = 0;

  for await (const row of parser as AsyncIterable<CsvRow>) {
    const bggId = toInt(row.id, -1);
    if (bggId < 0 || !row.name) {
      skipped++;
      continue;
    }

    batch.push(toGameRecord(row, bggId));

    if (batch.length >= BATCH_SIZE) {
      await flush(batch);
      imported += batch.length;
      process.stdout.write(`\r  imported ${imported} games...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await flush(batch);
    imported += batch.length;
  }

  process.stdout.write('\n');
  console.log(`Done. Imported ${imported}, skipped ${skipped}.`);

  const total = await prisma.game.count();
  console.log(`Total games in catalog: ${total}`);
}

function toGameRecord(row: CsvRow, bggId: number) {
  return {
    bggId,
    title: row.name,
    description: row.description ? stripHtml(row.description) : null,
    minPlayers: toInt(row.min_players, 1),
    maxPlayers: toInt(row.max_players, 4),
    minPlaytime: toInt(row.min_play_time, 0) || null,
    maxPlaytime: toInt(row.max_play_time, 0) || null,
    weight: toFloat(row.weight, 2.5),
    thumbnail: row.image || null,
    categories: [] as string[],
  };
}

async function flush(batch: ReturnType<typeof toGameRecord>[]) {
  // createMany with skipDuplicates — fast, idempotent
  await prisma.game.createMany({
    data: batch,
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
