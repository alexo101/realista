ALTER TABLE "properties" ALTER COLUMN "agent_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "client_id" integer;
--> statement-breakpoint
ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "properties"
  ADD CONSTRAINT "properties_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_owner_check";
--> statement-breakpoint
ALTER TABLE "properties"
  ADD CONSTRAINT "properties_owner_check"
  CHECK (
    ("agent_id" IS NOT NULL AND "client_id" IS NULL)
    OR ("agent_id" IS NULL AND "client_id" IS NOT NULL)
  );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "properties_client_id_unique"
  ON "properties" ("client_id")
  WHERE "client_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_client_id_idx" ON "properties" ("client_id");
--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "agent_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "owner_client_id" integer;
--> statement-breakpoint
ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_owner_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "inquiries"
  ADD CONSTRAINT "inquiries_owner_client_id_clients_id_fk"
  FOREIGN KEY ("owner_client_id") REFERENCES "clients"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_recipient_check";
--> statement-breakpoint
ALTER TABLE "inquiries"
  ADD CONSTRAINT "inquiries_recipient_check"
  CHECK ("agent_id" IS NOT NULL OR "owner_client_id" IS NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_owner_client_id_idx" ON "inquiries" ("owner_client_id");
