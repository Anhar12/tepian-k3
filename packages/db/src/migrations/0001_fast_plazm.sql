CREATE TABLE "worksheet_operational_costs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"item" varchar(255) NOT NULL,
	"unit_count" integer DEFAULT 1 NOT NULL,
	"days" integer DEFAULT 1 NOT NULL,
	"unit_cost" integer,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD CONSTRAINT "worksheet_operational_costs_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_operational_cost_id_idx" ON "worksheet_operational_costs" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_operational_cost_worksheet_id_idx" ON "worksheet_operational_costs" USING btree ("worksheet_id");