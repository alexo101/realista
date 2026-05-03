/**
 * Backfill script for agency `latitude` / `longitude` columns.
 *
 * Migration `0006_agency_coordinates.sql` adds the coordinate columns to the
 * agencies table but leaves them NULL for every existing row. The Agencias map
 * view on the neighborhood-results page falls back to client-side geocoding for
 * agencies without coords, but doing it once on the server is much faster.
 *
 * Usage:
 *   tsx scripts/backfill-agency-coordinates.ts          # geocode all missing
 *   tsx scripts/backfill-agency-coordinates.ts --all    # re-geocode every agency
 *   tsx scripts/backfill-agency-coordinates.ts --agency-id=12
 *   tsx scripts/backfill-agency-coordinates.ts --dry-run
 */

import { db } from '../server/db';
import { agencies } from '../shared/schema';
import { and, eq, isNull, or, sql } from 'drizzle-orm';

interface Args {
  all: boolean;
  agencyId?: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, dryRun: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--all') args.all = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw.startsWith('--agency-id=')) args.agencyId = parseInt(raw.split('=')[1], 10);
    else {
      console.error(`Unknown argument: ${raw}`);
      process.exit(1);
    }
  }
  return args;
}

async function geocodeOne(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=es&components=country:ES&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data: any = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;
  const loc = data.results[0].geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set');
    process.exit(1);
  }

  const conditions: any[] = [sql`${agencies.agencyAddress} IS NOT NULL AND ${agencies.agencyAddress} <> ''`];
  if (args.agencyId !== undefined) {
    conditions.push(eq(agencies.id, args.agencyId));
  }
  if (!args.all) {
    conditions.push(or(isNull(agencies.latitude), isNull(agencies.longitude)));
  }

  const rows = await db
    .select({ id: agencies.id, agencyName: agencies.agencyName, agencyAddress: agencies.agencyAddress, city: agencies.city })
    .from(agencies)
    .where(and(...conditions));

  console.log(`Found ${rows.length} agency rows to process${args.dryRun ? ' (dry-run)' : ''}.`);

  let ok = 0;
  let fail = 0;
  for (const row of rows) {
    const fullAddress = `${row.agencyAddress}${row.city ? `, ${row.city}` : ''}, Spain`;
    process.stdout.write(`  • [${row.id}] ${row.agencyName} — ${fullAddress} ... `);
    if (args.dryRun) {
      process.stdout.write('skipped (dry-run)\n');
      continue;
    }
    try {
      const coords = await geocodeOne(fullAddress, apiKey);
      if (!coords) {
        fail++;
        process.stdout.write('NO RESULT\n');
      } else {
        await db
          .update(agencies)
          .set({ latitude: coords.lat, longitude: coords.lng })
          .where(eq(agencies.id, row.id));
        ok++;
        process.stdout.write(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}\n`);
      }
    } catch (err) {
      fail++;
      process.stdout.write(`ERROR: ${(err as Error).message}\n`);
    }
    // Be polite to the Google Geocoding API
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. ${ok} updated, ${fail} failed, ${rows.length - ok - fail} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
