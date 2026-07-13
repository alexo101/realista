ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "client_type" text,
  ADD COLUMN IF NOT EXISTS "tags" text[];
