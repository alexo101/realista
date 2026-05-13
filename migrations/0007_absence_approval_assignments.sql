CREATE TABLE IF NOT EXISTS "absence_approval_assignments" (
  "id" serial PRIMARY KEY NOT NULL,
  "agency_id" integer NOT NULL,
  "agent_id" integer NOT NULL,
  "approver_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_approval_assignments_agency_id_agencies_id_fk'
  ) THEN
    ALTER TABLE "absence_approval_assignments"
      ADD CONSTRAINT "absence_approval_assignments_agency_id_agencies_id_fk"
      FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_approval_assignments_agent_id_agents_id_fk'
  ) THEN
    ALTER TABLE "absence_approval_assignments"
      ADD CONSTRAINT "absence_approval_assignments_agent_id_agents_id_fk"
      FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absence_approval_assignments_approver_id_agents_id_fk'
  ) THEN
    ALTER TABLE "absence_approval_assignments"
      ADD CONSTRAINT "absence_approval_assignments_approver_id_agents_id_fk"
      FOREIGN KEY ("approver_id") REFERENCES "public"."agents"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'absence_approval_assignments_agency_agent_unique'
  ) THEN
    CREATE UNIQUE INDEX "absence_approval_assignments_agency_agent_unique"
      ON "absence_approval_assignments" USING btree ("agency_id","agent_id");
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "absence_approval_assignments_agency_idx"
  ON "absence_approval_assignments" USING btree ("agency_id");
