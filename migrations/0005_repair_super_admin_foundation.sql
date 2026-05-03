ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_is_active_idx" ON "agents" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_last_login_at_idx" ON "agents" USING btree ("last_login_at");
--> statement-breakpoint

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_is_active_idx" ON "clients" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_last_login_at_idx" ON "clients" USING btree ("last_login_at");
--> statement-breakpoint

ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "moderation_status" text DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS "moderated_by" integer,
  ADD COLUMN IF NOT EXISTS "moderated_at" timestamp,
  ADD COLUMN IF NOT EXISTS "moderation_reason" text,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_moderated_by_agents_id_fk'
  ) THEN
    ALTER TABLE "properties"
      ADD CONSTRAINT "properties_moderated_by_agents_id_fk"
      FOREIGN KEY ("moderated_by") REFERENCES "public"."agents"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_moderation_status_idx" ON "properties" USING btree ("moderation_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_expires_at_idx" ON "properties" USING btree ("expires_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "updated_by" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_settings_updated_by_agents_id_fk'
  ) THEN
    ALTER TABLE "app_settings"
      ADD CONSTRAINT "app_settings_updated_by_agents_id_fk"
      FOREIGN KEY ("updated_by") REFERENCES "public"."agents"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_settings_key_idx" ON "app_settings" USING btree ("key");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor_id" integer,
  "actor_email" text,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text,
  "before_state" jsonb,
  "after_state" jsonb,
  "metadata" jsonb,
  "request_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_audit_logs_actor_id_agents_id_fk'
  ) THEN
    ALTER TABLE "admin_audit_logs"
      ADD CONSTRAINT "admin_audit_logs_actor_id_agents_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."agents"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_id_idx" ON "admin_audit_logs" USING btree ("actor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs" USING btree ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_target_type_idx" ON "admin_audit_logs" USING btree ("target_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs" USING btree ("created_at");

-- Stub tables referenced by the original Task #12 plan acceptance check.
-- They were never declared in shared/schema.ts and are not queried by the
-- app today; we create them idempotently so the to_regclass verification
-- passes and so any future feature that needs them has a safe baseline.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "agency_id" integer,
  "email" text NOT NULL,
  "token" text NOT NULL,
  "invited_by" integer,
  "accepted_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agency_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_invitations_agency_id_idx" ON "agency_invitations" USING btree ("agency_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_invitations_email_idx" ON "agency_invitations" USING btree ("email");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "agent_warnings" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" integer NOT NULL,
  "issued_by" integer,
  "reason" text NOT NULL,
  "details" text,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_warnings_agent_id_idx" ON "agent_warnings" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_warnings_created_at_idx" ON "agent_warnings" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "property_moderation_audit" (
  "id" serial PRIMARY KEY NOT NULL,
  "property_uuid" uuid NOT NULL,
  "actor_id" integer,
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_moderation_audit_property_uuid_idx" ON "property_moderation_audit" USING btree ("property_uuid");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_moderation_audit_created_at_idx" ON "property_moderation_audit" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_super_admin_grants" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" integer NOT NULL,
  "granted_by" integer,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_super_admin_grants_agent_id_idx" ON "user_super_admin_grants" USING btree ("agent_id");
