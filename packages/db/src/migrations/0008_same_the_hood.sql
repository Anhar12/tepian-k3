CREATE TYPE "public"."worksheet_note_status" AS ENUM('info', 'warning', 'danger', 'success', 'important', 'question', 'urgent', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."worksheet_status" AS ENUM('draft', 'in_progress', 'completed', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "worksheet_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"value" real,
	"note" text,
	"is_ready" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" uuid NOT NULL,
	"severity" "worksheet_note_status" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "worksheet_status" DEFAULT 'in_progress' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"main_supervisor_id" uuid,
	"accompanying_supervisor_id" uuid,
	"result" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_notes" ADD CONSTRAINT "worksheet_notes_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_notes" ADD CONSTRAINT "worksheet_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_testing_id_testing_id_fk" FOREIGN KEY ("testing_id") REFERENCES "public"."testing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_main_supervisor_id_employees_id_fk" FOREIGN KEY ("main_supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_accompanying_supervisor_id_employees_id_fk" FOREIGN KEY ("accompanying_supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_assignment_id_idx" ON "worksheet_assignments" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_assignment_worksheet_id_idx" ON "worksheet_assignments" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_assignment_employee_id_idx" ON "worksheet_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_id_idx" ON "worksheet_items" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_item_worksheet_id_idx" ON "worksheet_items" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_parameter_id_idx" ON "worksheet_items" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_location_id_idx" ON "worksheet_items" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "worksheet_note_id_idx" ON "worksheet_notes" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_note_worksheet_id_idx" ON "worksheet_notes" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_id_idx" ON "worksheet_tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_worksheet_id_idx" ON "worksheet_tools" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_tool_id_idx" ON "worksheet_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "worksheet_id_idx" ON "worksheets" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_testing_id_idx" ON "worksheets" USING btree ("testing_id");--> statement-breakpoint
CREATE INDEX "worksheet_user_id_idx" ON "worksheets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worksheet_status_idx" ON "worksheets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worksheet_main_supervisor_id_idx" ON "worksheets" USING btree ("main_supervisor_id");--> statement-breakpoint
CREATE INDEX "worksheet_accompanying_supervisor_id_idx" ON "worksheets" USING btree ("accompanying_supervisor_id");