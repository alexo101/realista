CREATE TABLE IF NOT EXISTS "work_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" integer NOT NULL,
  "work_date" text NOT NULL,
  "clock_in_at" timestamp NOT NULL,
  "clock_out_at" timestamp,
  "breaks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_sessions_agent_id_agents_id_fk'
  ) THEN
    ALTER TABLE "work_sessions"
      ADD CONSTRAINT "work_sessions_agent_id_agents_id_fk"
      FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "work_sessions_agent_date_unique" ON "work_sessions" USING btree ("agent_id","work_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_sessions_agent_idx" ON "work_sessions" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_sessions_date_idx" ON "work_sessions" USING btree ("work_date");
