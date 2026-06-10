CREATE TYPE "public"."pelatihan_type" AS ENUM('elearning', 'bimtek', 'webinar');--> statement-breakpoint
CREATE TABLE "pelatihan_modules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "type" "pelatihan_type" DEFAULT 'elearning' NOT NULL;--> statement-breakpoint
ALTER TABLE "pelatihan_materials" ADD COLUMN "module_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_modules" ADD CONSTRAINT "pelatihan_modules_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_materials" ADD CONSTRAINT "pelatihan_materials_module_id_pelatihan_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."pelatihan_modules"("id") ON DELETE set null ON UPDATE no action;