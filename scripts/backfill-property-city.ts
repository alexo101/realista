/**
 * Backfill `properties.city` and `properties.district` from catalog neighborhood.
 *
 * Matching uses the internal city catalog (not Google locality). Run after deploying
 * the property form + API changes that persist city/district on barrio select.
 *
 * Usage:
 *   tsx scripts/backfill-property-city.ts --dry-run
 *   tsx scripts/backfill-property-city.ts
 *   tsx scripts/backfill-property-city.ts --only-missing
 */

import { db } from "../server/db";
import { properties } from "../shared/schema";
import { eq, isNull, or, sql } from "drizzle-orm";
import { resolvePropertyLocation } from "../server/utils/neighborhoods";

interface Args {
  dryRun: boolean;
  onlyMissing: boolean;
}

function parseArgs(argv: string[]): Args {
  return {
    dryRun: argv.includes("--dry-run"),
    onlyMissing: argv.includes("--only-missing"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("Backfilling property city/district from neighborhood catalog...");
  console.log(`Mode: ${args.dryRun ? "dry-run" : "write"}${args.onlyMissing ? ", only-missing" : ""}`);

  const rows = await db
    .select({
      uuid: properties.uuid,
      neighborhood: properties.neighborhood,
      city: properties.city,
      district: properties.district,
      locality: properties.locality,
    })
    .from(properties)
    .where(
      args.onlyMissing
        ? or(isNull(properties.city), eq(properties.city, ""))
        : undefined,
    );

  console.log(`Loaded ${rows.length} properties`);

  let updated = 0;
  let unchanged = 0;
  let unresolved = 0;
  const unresolvedSamples: Array<{ uuid: string; neighborhood: string; locality: string | null }> = [];

  for (const row of rows) {
    const resolved = resolvePropertyLocation({
      neighborhood: row.neighborhood,
      city: row.city,
      district: row.district,
      locality: row.locality,
    });

    if (!resolved.city) {
      unresolved += 1;
      if (unresolvedSamples.length < 25) {
        unresolvedSamples.push({
          uuid: row.uuid,
          neighborhood: row.neighborhood,
          locality: row.locality ?? null,
        });
      }
      continue;
    }

    const cityChanged = resolved.city !== row.city;
    const districtChanged = resolved.district !== row.district;
    if (!cityChanged && !districtChanged) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    if (!args.dryRun) {
      await db
        .update(properties)
        .set({
          city: resolved.city,
          district: resolved.district,
        })
        .where(eq(properties.uuid, row.uuid));
    }
  }

  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Unresolved: ${unresolved}`);
  if (unresolvedSamples.length > 0) {
    console.log("Unresolved samples (manual review):");
    for (const sample of unresolvedSamples) {
      console.log(
        `  ${sample.uuid} | neighborhood="${sample.neighborhood}" | locality="${sample.locality ?? ""}"`,
      );
    }
  }

  const remainingMissing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .where(or(isNull(properties.city), eq(properties.city, "")));
  console.log(`Properties still missing city: ${remainingMissing[0]?.count ?? "?"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
