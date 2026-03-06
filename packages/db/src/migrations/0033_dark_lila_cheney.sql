ALTER TABLE "worksheet_tools" ADD COLUMN "returned_by" uuid;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD COLUMN "returned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_returned_by_employees_id_fk" FOREIGN KEY ("returned_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;