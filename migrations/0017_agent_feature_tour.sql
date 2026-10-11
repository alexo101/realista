ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "feature_tour_state" jsonb NOT NULL
  DEFAULT '{"skippedCards":[],"completedCards":[],"dismissedAll":false}'::jsonb;
