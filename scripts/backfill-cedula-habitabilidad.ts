/**
 * Backfill script for the `has_cedula_habitabilidad` column on properties.
 *
 * After the migration `0004_has_cedula_habitabilidad.sql` adds the column
 * with a default of `false`, every existing property is hidden from the
 * "Solo con cédula de habitabilidad" search filter until it is updated.
 *
 * This script lets an admin flip the flag in bulk without manually editing
 * each property. Run it once, after the migration is applied, and only when
 * you have confirmed which properties actually have a cédula.
 *
 * Usage:
 *   # Mark every property in the database (use with care):
 *   tsx scripts/backfill-cedula-habitabilidad.ts --all
 *
 *   # Mark every property of an agency:
 *   tsx scripts/backfill-cedula-habitabilidad.ts --agency-id=12
 *
 *   # Mark every property of a single agent:
 *   tsx scripts/backfill-cedula-habitabilidad.ts --agent-id=42
 *
 *   # Set them to "no cédula" instead of "has cédula":
 *   tsx scripts/backfill-cedula-habitabilidad.ts --agency-id=12 --value=false
 *
 *   # Dry-run (count properties without writing):
 *   tsx scripts/backfill-cedula-habitabilidad.ts --agency-id=12 --dry-run
 */

import { db } from '../server/db';
import { properties } from '../shared/schema';
import { and, eq, sql } from 'drizzle-orm';

interface Args {
  all: boolean;
  agencyId?: number;
  agentId?: number;
  value: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, value: true, dryRun: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--all') args.all = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw.startsWith('--agency-id=')) args.agencyId = parseInt(raw.split('=')[1], 10);
    else if (raw.startsWith('--agent-id=')) args.agentId = parseInt(raw.split('=')[1], 10);
    else if (raw.startsWith('--value=')) args.value = raw.split('=')[1] === 'true';
    else {
      console.error(`Unknown argument: ${raw}`);
      process.exit(1);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.all && args.agencyId === undefined && args.agentId === undefined) {
    console.error('You must pass at least one scope: --all, --agency-id=N, or --agent-id=N');
    process.exit(1);
  }

  const conditions = [] as any[];
  if (args.agencyId !== undefined) conditions.push(eq(properties.agencyId, args.agencyId));
  if (args.agentId !== undefined) conditions.push(eq(properties.agentId, args.agentId));

  const whereClause = conditions.length === 0 ? undefined : and(...conditions);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .where(whereClause as any);

  console.log(
    `Scope matches ${count} properties. Target value: hasCedulaHabitabilidad=${args.value}.`,
  );

  if (args.dryRun) {
    console.log('Dry-run requested; no changes written.');
    process.exit(0);
  }

  const updated = await db
    .update(properties)
    .set({ hasCedulaHabitabilidad: args.value })
    .where(whereClause as any)
    .returning({ uuid: properties.uuid });

  console.log(`Updated ${updated.length} properties.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
