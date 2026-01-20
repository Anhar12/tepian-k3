CREATE TABLE "worksheet_chemical_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"chemical_material_id" uuid NOT NULL,
	"required" real DEFAULT 0 NOT NULL,
	"required_unit" "bahan_unit",
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "worksheet_chemical_materials" ADD CONSTRAINT "worksheet_chemical_materials_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_chemical_materials" ADD CONSTRAINT "worksheet_chemical_materials_chemical_material_id_chemical_materials_id_fk" FOREIGN KEY ("chemical_material_id") REFERENCES "public"."chemical_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_id_idx" ON "worksheet_chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_worksheet_id_idx" ON "worksheet_chemical_materials" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_chemical_material_id_idx" ON "worksheet_chemical_materials" USING btree ("chemical_material_id");