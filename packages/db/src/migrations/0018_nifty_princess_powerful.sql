CREATE TABLE "pelatihan_certificate_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"template_file_url" varchar(500) NOT NULL,
	"template_file_name" varchar(250) NOT NULL,
	"template_file_type" varchar(50) NOT NULL,
	"field_mappings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "dynamic_requirements" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "certificate_number_format" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_certificate_templates" ADD CONSTRAINT "pelatihan_certificate_templates_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificate_templates" ADD CONSTRAINT "pelatihan_certificate_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cert_template_pelatihan_idx" ON "pelatihan_certificate_templates" USING btree ("pelatihan_id");--> statement-breakpoint
CREATE INDEX "cert_template_active_idx" ON "pelatihan_certificate_templates" USING btree ("pelatihan_id","is_active");--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_template_id_pelatihan_certificate_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."pelatihan_certificate_templates"("id") ON DELETE set null ON UPDATE no action;