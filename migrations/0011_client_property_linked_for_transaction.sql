ALTER TABLE "client_property_statuses"
  ADD COLUMN IF NOT EXISTS "linked_for_transaction" boolean NOT NULL DEFAULT false;
