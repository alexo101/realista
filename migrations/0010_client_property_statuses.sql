CREATE TABLE IF NOT EXISTS "client_property_statuses" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" integer NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "property_uuid" uuid NOT NULL REFERENCES "properties"("uuid") ON DELETE CASCADE,
  "status" text DEFAULT 'recommended' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "client_property_statuses_status_check"
    CHECK ("status" IN ('recommended', 'sent', 'visit_scheduled', 'interested', 'rejected', 'purchased_rented'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "client_property_statuses_client_property_idx"
  ON "client_property_statuses" ("client_id", "property_uuid");
