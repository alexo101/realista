ALTER TABLE "password_reset_tokens"
  ADD COLUMN IF NOT EXISTS "purpose" text NOT NULL DEFAULT 'reset';
--> statement-breakpoint
ALTER TABLE "password_reset_tokens"
  DROP CONSTRAINT IF EXISTS "password_reset_tokens_purpose_check";
--> statement-breakpoint
ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_purpose_check"
  CHECK ("purpose" IN ('reset', 'welcome'));
