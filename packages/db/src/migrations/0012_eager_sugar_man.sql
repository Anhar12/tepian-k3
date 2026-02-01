CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"banner_url" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "banner_id_idx" ON "banners" USING btree ("id");--> statement-breakpoint
CREATE INDEX "banner_order_idx" ON "banners" USING btree ("order");--> statement-breakpoint
CREATE INDEX "banner_is_active_idx" ON "banners" USING btree ("is_active");