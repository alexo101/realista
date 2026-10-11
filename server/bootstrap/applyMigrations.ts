import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "../db";

/** Stable advisory lock so overlapping boots cannot apply the same migration. */
const MIGRATION_LOCK_KEY = 80160016;

function resolveMigrationsFolder(): string {
  const candidates = [
    path.resolve(process.cwd(), "migrations"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../migrations"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }

  throw new Error(
    "Cannot find database migrations folder (migrations/meta/_journal.json).",
  );
}

/**
 * Apply journaled SQL migrations that are not yet recorded in
 * drizzle.__drizzle_migrations. Already-applied migrations are skipped.
 * Failures propagate so the process does not serve traffic on a stale schema.
 */
export async function applyPendingMigrations(): Promise<void> {
  const migrationsFolder = resolveMigrationsFolder();
  const client = await pool.connect();
  let locked = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    locked = true;
    console.log("Applying pending database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Database migrations are up to date");
  } finally {
    if (locked) {
      try {
        await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
      } catch (unlockError) {
        console.error("Failed to release migration lock:", unlockError);
      }
    }
    client.release();
  }
}
