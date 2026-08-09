CREATE INDEX IF NOT EXISTS "reviews_target_type_target_id_idx"
  ON "reviews" USING btree ("target_type", "target_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_property_uuid_idx"
  ON "reviews" USING btree ("property_uuid");
