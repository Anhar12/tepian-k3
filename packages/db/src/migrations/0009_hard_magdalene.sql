ALTER TABLE "worksheet_tools" ADD COLUMN "tool_needed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheet_items" DROP COLUMN "value";