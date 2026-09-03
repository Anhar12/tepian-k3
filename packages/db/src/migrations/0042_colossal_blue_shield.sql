CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"bio" text,
	"photo_url" text,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "team_members_id_idx" ON "team_members" USING btree ("id");--> statement-breakpoint
CREATE INDEX "team_members_order_idx" ON "team_members" USING btree ("order");--> statement-breakpoint
CREATE INDEX "team_members_is_active_idx" ON "team_members" USING btree ("is_active");