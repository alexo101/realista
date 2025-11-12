CREATE TABLE "agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"agency_name" text NOT NULL,
	"agency_address" text,
	"agency_description" text,
	"agency_logo" text,
	"agency_email_to_display" text,
	"agency_phone" text,
	"agency_active_since" text,
	"city" text,
	"agencyInfluenceNeighborhoods" text[],
	"agency_supported_languages" text[],
	"agency_website" text,
	"agency_social_media" jsonb,
	"subscription_plan" text,
	"is_yearly_billing" boolean DEFAULT false,
	"seats_limit" integer,
	"active_properties_limit" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agency_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_check" CHECK ("agency_agents"."role" IN ('admin', 'member'))
);
--> statement-breakpoint
CREATE TABLE "agent_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"client_id" integer,
	"property_id" integer,
	"event_type" text NOT NULL,
	"event_date" text NOT NULL,
	"event_time" text NOT NULL,
	"comments" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_favorite_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"agency_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"consumed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"surname" text,
	"phone" text,
	"description" text,
	"avatar" text,
	"city" text,
	"influence_neighborhoods" text[],
	"years_of_experience" integer,
	"languages_spoken" text[],
	"agent_type" text DEFAULT 'independent' NOT NULL,
	"subscription_plan" text,
	"is_yearly_billing" boolean DEFAULT false,
	"paused_subscription_plan" text,
	"paused_is_yearly_billing" boolean,
	"paused_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "agents_slug_unique" UNIQUE("slug"),
	CONSTRAINT "agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"type" text NOT NULL,
	"date" timestamp NOT NULL,
	"time" text NOT NULL,
	"property_id" integer,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_favorite_agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"agency_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_favorite_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_favorite_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"surname" text,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password" text,
	"property_interest" text,
	"budget" integer,
	"notes" text,
	"agent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"avatar" text,
	"employment_status" text,
	"position" text,
	"years_at_position" integer,
	"monthly_income" integer,
	"number_of_people" integer,
	"relationship" text,
	"has_minors" boolean DEFAULT false,
	"has_adolescents" boolean DEFAULT false,
	"pets_status" text,
	"pets_description" text,
	"move_in_timing" text,
	"move_in_date" timestamp,
	CONSTRAINT "clients_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiry_id" integer NOT NULL,
	"sender_type" text NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"reporter_ip" text,
	"reporter_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"property_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighborhood_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"city" text,
	"district" text,
	"neighborhood" text NOT NULL,
	"security" numeric NOT NULL,
	"parking" numeric NOT NULL,
	"family_friendly" numeric NOT NULL,
	"public_transport" numeric NOT NULL,
	"green_spaces" numeric NOT NULL,
	"services" numeric NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_type" text NOT NULL,
	"user_id" integer NOT NULL,
	"user_email" text,
	"inquiry_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"reference" text,
	"address" text NOT NULL,
	"escalera" text,
	"planta" text,
	"puerta" text,
	"type" text NOT NULL,
	"operation_type" text NOT NULL,
	"housing_type" text,
	"housing_status" text,
	"floor" text,
	"features" text[],
	"availability" text,
	"availability_date" timestamp,
	"previous_price" integer,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"city" text,
	"district" text,
	"neighborhood" text NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"superficie" integer,
	"image_urls" text[],
	"main_image_index" integer DEFAULT 0,
	"title" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"agent_id" integer NOT NULL,
	"agency_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"fraud_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "property_visit_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"requested_date" timestamp NOT NULL,
	"requested_time" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"client_notes" text,
	"agent_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_id" integer NOT NULL,
	"target_type" text,
	"property_id" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"comment" text,
	"agent_response" text,
	"response_date" timestamp,
	"area_knowledge" numeric(2, 1) NOT NULL,
	"price_negotiation" numeric(2, 1) NOT NULL,
	"treatment" numeric(2, 1) NOT NULL,
	"punctuality" numeric(2, 1) NOT NULL,
	"property_knowledge" numeric(2, 1) NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"author" text,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"district" text,
	"neighborhood" text,
	"operation_type" text,
	"min_price" integer,
	"max_price" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"characteristics" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"triggered_by" integer,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_agents" ADD CONSTRAINT "agency_agents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_agents" ADD CONSTRAINT "agency_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_favorite_properties" ADD CONSTRAINT "agent_favorite_properties_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_favorite_properties" ADD CONSTRAINT "agent_favorite_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_invited_by_agents_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_agencies" ADD CONSTRAINT "client_favorite_agencies_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_agencies" ADD CONSTRAINT "client_favorite_agencies_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_agents" ADD CONSTRAINT "client_favorite_agents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_agents" ADD CONSTRAINT "client_favorite_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_properties" ADD CONSTRAINT "client_favorite_properties_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_favorite_properties" ADD CONSTRAINT "client_favorite_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_reports" ADD CONSTRAINT "fraud_reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_visit_requests" ADD CONSTRAINT "property_visit_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_visit_requests" ADD CONSTRAINT "property_visit_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_visit_requests" ADD CONSTRAINT "property_visit_requests_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_agent" ON "agency_agents" USING btree ("agent_id") WHERE "agency_agents"."left_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_admin" ON "agency_agents" USING btree ("agency_id") WHERE "agency_agents"."role" = 'admin' AND "agency_agents"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "clients_agent_id_idx" ON "clients" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "clients_email_idx" ON "clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "properties_neighborhood_idx" ON "properties" USING btree ("neighborhood");--> statement-breakpoint
CREATE INDEX "properties_city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "properties_agent_id_idx" ON "properties" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "properties_agency_id_idx" ON "properties" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "properties_operation_type_idx" ON "properties" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "properties_is_active_idx" ON "properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "properties_neighborhood_operation_idx" ON "properties" USING btree ("neighborhood","operation_type");--> statement-breakpoint
CREATE INDEX "properties_agent_active_idx" ON "properties" USING btree ("agent_id","is_active");--> statement-breakpoint
CREATE INDEX "properties_agency_active_idx" ON "properties" USING btree ("agency_id","is_active");--> statement-breakpoint
CREATE INDEX "properties_view_count_idx" ON "properties" USING btree ("view_count");