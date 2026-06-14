CREATE TABLE "media_publications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"category" varchar(100) DEFAULT 'media' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"publisher" varchar(255) DEFAULT 'Balai K3 Samarinda' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "media_publications_id_idx" ON "media_publications" USING btree ("id");--> statement-breakpoint
CREATE INDEX "media_publications_category_idx" ON "media_publications" USING btree ("category");--> statement-breakpoint
CREATE INDEX "media_publications_is_published_idx" ON "media_publications" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "media_publications_published_at_idx" ON "media_publications" USING btree ("published_at");