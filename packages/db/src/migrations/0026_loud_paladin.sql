CREATE TABLE "worksheet_tool_needed" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"tool_needed" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "worksheet_tool_needed" ADD CONSTRAINT "worksheet_tool_needed_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tool_needed" ADD CONSTRAINT "worksheet_tool_needed_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_id_idx" ON "worksheet_tool_needed" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_worksheet_id_idx" ON "worksheet_tool_needed" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_tool_id_idx" ON "worksheet_tool_needed" USING btree ("tool_id");