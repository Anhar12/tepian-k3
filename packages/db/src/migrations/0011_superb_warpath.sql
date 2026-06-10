CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(100) DEFAULT 'general' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(250) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "faq_id_idx" ON "faqs" USING btree ("id");--> statement-breakpoint
CREATE INDEX "faq_category_idx" ON "faqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_is_active_idx" ON "faqs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_unique_idx" ON "settings" USING btree ("key") WHERE "settings"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "settings_id_idx" ON "settings" USING btree ("id");