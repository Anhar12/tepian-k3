CREATE TABLE "tool_calibration_certificates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_calibration_id" uuid NOT NULL,
	"certificate_file_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_calibration_documentations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_calibration_id" uuid NOT NULL,
	"documentation_file_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_calibrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_id" uuid NOT NULL,
	"calibration_date" timestamp with time zone NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tool_calibration_certificates" ADD CONSTRAINT "tool_calibration_certificates_tool_calibration_id_tool_calibrations_id_fk" FOREIGN KEY ("tool_calibration_id") REFERENCES "public"."tool_calibrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calibration_documentations" ADD CONSTRAINT "tool_calibration_documentations_tool_calibration_id_tool_calibrations_id_fk" FOREIGN KEY ("tool_calibration_id") REFERENCES "public"."tool_calibrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calibrations" ADD CONSTRAINT "tool_calibrations_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_calibration_certificate_id_idx" ON "tool_calibration_certificates" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_certificate_tool_calibration_id_idx" ON "tool_calibration_certificates" USING btree ("tool_calibration_id");--> statement-breakpoint
CREATE INDEX "tool_calibration_documentation_id_idx" ON "tool_calibration_documentations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_documentation_tool_calibration_id_idx" ON "tool_calibration_documentations" USING btree ("tool_calibration_id");--> statement-breakpoint
CREATE INDEX "tool_calibration_id_idx" ON "tool_calibrations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_tool_id_idx" ON "tool_calibrations" USING btree ("tool_id");