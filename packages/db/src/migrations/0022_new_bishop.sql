CREATE TABLE "employee_certifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"employee_id" uuid NOT NULL,
	"certification_name" varchar(255) NOT NULL,
	"issued_by" varchar(255) NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone,
	"certificate_file_url" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_certification_id_idx" ON "employee_certifications" USING btree ("id");--> statement-breakpoint
CREATE INDEX "employee_certification_employee_id_idx" ON "employee_certifications" USING btree ("employee_id");