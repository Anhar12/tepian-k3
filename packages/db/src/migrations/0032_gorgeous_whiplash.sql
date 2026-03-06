ALTER TABLE "tools" RENAME COLUMN "tool_code" TO "tool_code_id";--> statement-breakpoint
ALTER TABLE "tools" DROP CONSTRAINT "tools_tool_code_tool_codes_id_fk";
--> statement-breakpoint
DROP INDEX "tool_tool_code_idx";--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tool_code_id_tool_codes_id_fk" FOREIGN KEY ("tool_code_id") REFERENCES "public"."tool_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_tool_code_id_idx" ON "tools" USING btree ("tool_code_id");