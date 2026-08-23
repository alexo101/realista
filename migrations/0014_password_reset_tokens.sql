CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL,
  "user_type" text NOT NULL,
  "user_id" integer NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash"),
  CONSTRAINT "password_reset_tokens_user_type_check" CHECK ("user_type" IN ('agent', 'client'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_idx"
  ON "password_reset_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx"
  ON "password_reset_tokens" USING btree ("user_type", "user_id");
