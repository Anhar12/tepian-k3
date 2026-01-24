CREATE TYPE "public"."bahan_status" AS ENUM('tersedia', 'hampir_habis', 'habis', 'expired', 'dipesan');--> statement-breakpoint
CREATE TYPE "public"."bahan_unit" AS ENUM('gram', 'kg', 'botol', 'ml', 'liter');--> statement-breakpoint
ALTER TYPE "public"."worksheet_status" ADD VALUE 'revision' BEFORE 'verified';--> statement-breakpoint
ALTER TYPE "public"."worksheet_status" ADD VALUE 'rejected';--> statement-breakpoint
CREATE TABLE "chemical_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"catalog_number" varchar(100),
	"chemical_formula" varchar(100),
	"name" varchar(256) NOT NULL,
	"used_stock" real DEFAULT 0,
	"used_stock_unit" "bahan_unit",
	"sealed_stock" real DEFAULT 0,
	"sealed_stock_unit" "bahan_unit",
	"monthly_usage" real,
	"monthly_usage_unit" "bahan_unit",
	"remaining_used_material" real,
	"remaining_used_material_unit" "bahan_unit",
	"incoming_material_note" text,
	"expired_date" timestamp with time zone,
	"status" "bahan_status" DEFAULT 'tersedia' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "chemical_materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "parameter_chemical_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_id" uuid NOT NULL,
	"chemical_material_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "parameter_chemical_materials" ADD CONSTRAINT "parameter_chemical_materials_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_chemical_materials" ADD CONSTRAINT "parameter_chemical_materials_chemical_material_id_chemical_materials_id_fk" FOREIGN KEY ("chemical_material_id") REFERENCES "public"."chemical_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chemical_material_id_idx" ON "chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "chemical_material_code_idx" ON "chemical_materials" USING btree ("code");--> statement-breakpoint
CREATE INDEX "chemical_material_name_idx" ON "chemical_materials" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_id_idx" ON "parameter_chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_parameter_id_idx" ON "parameter_chemical_materials" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_chemical_material_id_idx" ON "parameter_chemical_materials" USING btree ("chemical_material_id");