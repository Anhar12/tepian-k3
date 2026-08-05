CREATE TABLE "landing_regions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"province_name" varchar(100) NOT NULL,
	"province_key" varchar(50) NOT NULL,
	"company_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "landing_regions_province_key_unique" UNIQUE("province_key")
);
--> statement-breakpoint
CREATE TABLE "landing_stats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"primary_count" integer DEFAULT 0 NOT NULL,
	"primary_label" varchar(100) NOT NULL,
	"secondary_count" integer DEFAULT 0 NOT NULL,
	"secondary_label" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "landing_stats_service_type_unique" UNIQUE("service_type")
);
--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "type" varchar(20) DEFAULT 'hero' NOT NULL;--> statement-breakpoint
CREATE INDEX "landing_regions_id_idx" ON "landing_regions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "landing_regions_province_key_idx" ON "landing_regions" USING btree ("province_key");--> statement-breakpoint
CREATE INDEX "landing_regions_sort_order_idx" ON "landing_regions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "landing_stats_id_idx" ON "landing_stats" USING btree ("id");--> statement-breakpoint
CREATE INDEX "landing_stats_service_type_idx" ON "landing_stats" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "landing_stats_sort_order_idx" ON "landing_stats" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "banner_type_idx" ON "banners" USING btree ("type");