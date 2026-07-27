CREATE TYPE "public"."worksheet_proposed_date_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "worksheet_proposed_dates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"proposed_start_date" timestamp with time zone NOT NULL,
	"proposed_end_date" timestamp with time zone NOT NULL,
	"note" text,
	"status" "worksheet_proposed_date_status" DEFAULT 'pending' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "worksheet_proposed_dates" ADD CONSTRAINT "worksheet_proposed_dates_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_proposed_dates_worksheet_id_idx" ON "worksheet_proposed_dates" USING btree ("worksheet_id");