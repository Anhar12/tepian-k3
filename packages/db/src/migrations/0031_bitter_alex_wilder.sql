CREATE TABLE "tool_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(256) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "tool_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tools" DROP CONSTRAINT "tools_tool_code_unique";--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "tool_code" SET DATA TYPE uuid USING tool_code::uuid;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "tool_unique_code" varchar(256) NOT NULL;--> statement-breakpoint
CREATE INDEX "tool_code_id_idx" ON "tool_codes" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_code_code_idx" ON "tool_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "tool_code_is_active_idx" ON "tool_codes" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tool_code_tool_codes_id_fk" FOREIGN KEY ("tool_code") REFERENCES "public"."tool_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_tool_unique_code_idx" ON "tools" USING btree ("tool_unique_code");--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tool_unique_code_unique" UNIQUE("tool_unique_code");