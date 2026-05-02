#!/bin/bash
# Post-merge setup script.
#
# Stdin is closed when this runs, so every command must be non-interactive.
#
# We use `drizzle-kit migrate` (not `drizzle-kit push`) on purpose:
#   * `push` compares the live schema to the TS schema and asks interactive
#     questions on every ambiguous diff (renames, "add unique constraint to a
#     non-empty table", etc.). Those prompts read from /dev/tty and cannot be
#     auto-answered, so the merge would hang and time out.
#   * `migrate` just applies the pre-baked SQL files in `migrations/` against
#     the `drizzle.__drizzle_migrations` tracking table. It is fully
#     non-interactive and idempotent: already-applied migrations are skipped.
#
# Workflow for future schema changes:
#   1. Edit shared/schema.ts.
#   2. Run `npx drizzle-kit generate` locally to produce a new SQL file under
#      migrations/ and update migrations/meta/_journal.json.
#   3. Commit both. The next post-merge run will apply it automatically.
set -e
npm install
npm run db:migrate
