CREATE INDEX IF NOT EXISTS "agents_influence_neighborhoods_gin_idx"
  ON "agents" USING gin ("influence_neighborhoods");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_influence_neighborhoods_gin_idx"
  ON "agencies" USING gin ("agencyInfluenceNeighborhoods");
