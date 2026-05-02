CREATE TABLE IF NOT EXISTS "absence_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" integer NOT NULL,
  "agency_id" integer,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "absence_requests_reason_check" CHECK ("reason" IN ('vacaciones', 'remoto', 'baja_laboral')),
  CONSTRAINT "absence_requests_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected')),
  CONSTRAINT "absence_requests_range_check" CHECK ("start_date" <= "end_date")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_requests_agent_id_agents_id_fk'
  ) THEN
    ALTER TABLE "absence_requests"
      ADD CONSTRAINT "absence_requests_agent_id_agents_id_fk"
      FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_requests_agency_id_agencies_id_fk'
  ) THEN
    ALTER TABLE "absence_requests"
      ADD CONSTRAINT "absence_requests_agency_id_agencies_id_fk"
      FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_requests_reviewed_by_agents_id_fk'
  ) THEN
    ALTER TABLE "absence_requests"
      ADD CONSTRAINT "absence_requests_reviewed_by_agents_id_fk"
      FOREIGN KEY ("reviewed_by") REFERENCES "public"."agents"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "absence_requests_agent_idx" ON "absence_requests" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "absence_requests_agency_idx" ON "absence_requests" USING btree ("agency_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "absence_requests_status_idx" ON "absence_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "absence_requests_range_idx" ON "absence_requests" USING btree ("start_date","end_date");
