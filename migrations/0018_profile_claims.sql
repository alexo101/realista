CREATE TABLE IF NOT EXISTS "profile_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_type" text NOT NULL,
  "agent_id" integer REFERENCES "agents"("id") ON DELETE CASCADE,
  "agency_id" integer REFERENCES "agencies"("id") ON DELETE CASCADE,
  "owner_user_type" text NOT NULL,
  "owner_user_id" integer NOT NULL,
  "status" text DEFAULT 'verified' NOT NULL,
  "verified_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_claims_profile_type_check" CHECK ("profile_type" IN ('agent', 'agency')),
  CONSTRAINT "profile_claims_owner_type_check" CHECK ("owner_user_type" IN ('agent', 'client')),
  CONSTRAINT "profile_claims_status_check" CHECK ("status" IN ('verified', 'revoked', 'transferred')),
  CONSTRAINT "profile_claims_target_check" CHECK (("profile_type" = 'agent' AND "agent_id" IS NOT NULL AND "agency_id" IS NULL) OR ("profile_type" = 'agency' AND "agency_id" IS NOT NULL AND "agent_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profile_claims_unique_verified_agent" ON "profile_claims" ("agent_id") WHERE "status" = 'verified' AND "profile_type" = 'agent';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profile_claims_unique_verified_agency" ON "profile_claims" ("agency_id") WHERE "status" = 'verified' AND "profile_type" = 'agency';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profile_claims_unique_owner_agent_profile" ON "profile_claims" ("owner_user_type", "owner_user_id") WHERE "status" = 'verified' AND "profile_type" = 'agent';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_claims_owner_idx" ON "profile_claims" ("owner_user_type", "owner_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_claim_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL,
  "profile_type" text NOT NULL,
  "profile_id" integer NOT NULL,
  "sent_to_email" text NOT NULL,
  "origin" text DEFAULT 'self' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "requester_ip" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_claim_tokens_token_hash_unique" UNIQUE("token_hash"),
  CONSTRAINT "profile_claim_tokens_profile_type_check" CHECK ("profile_type" IN ('agent', 'agency')),
  CONSTRAINT "profile_claim_tokens_origin_check" CHECK ("origin" IN ('self', 'agency_invite'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_claim_tokens_profile_idx" ON "profile_claim_tokens" ("profile_type", "profile_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_claim_support_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "profile_type" text,
  "profile_id" integer,
  "contact_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "message" text,
  "status" text DEFAULT 'open' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_claim_support_requests_kind_check" CHECK ("kind" IN ('missing_profile', 'email_missing_or_outdated', 'delivery_failed', 'already_claimed'))
);
