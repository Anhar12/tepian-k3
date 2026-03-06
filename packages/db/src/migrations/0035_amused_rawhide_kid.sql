CREATE TABLE "tool_checks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_id" uuid NOT NULL,
	"checked_by" uuid NOT NULL,
	"check_alat_menyala" boolean NOT NULL,
	"check_penyimpangan" boolean NOT NULL,
	"check_kelengkapan_alat" boolean NOT NULL,
	"check_kondisi_fisik_alat" boolean NOT NULL,
	"check_condition_result" "tools_condition" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tool_checks" ADD CONSTRAINT "tool_checks_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_checks" ADD CONSTRAINT "tool_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_check_id_idx" ON "tool_checks" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_check_tool_id_idx" ON "tool_checks" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_check_checked_by_idx" ON "tool_checks" USING btree ("checked_by");