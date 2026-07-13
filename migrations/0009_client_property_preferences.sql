ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "property_preferences" jsonb;
