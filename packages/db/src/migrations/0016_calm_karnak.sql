ALTER TYPE "public"."document_type" ADD VALUE 'employment_letter';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'salary_slip';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'employment_contract';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'diploma';--> statement-breakpoint
CREATE TABLE "user_training_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(250),
	"company_address" text,
	"company_province_id" uuid,
	"company_regency_id" uuid,
	"company_district_id" uuid,
	"company_kbli" varchar(250),
	"participant_name" varchar(250),
	"participant_nik" varchar(50),
	"participant_birth_place" varchar(250),
	"participant_birth_date" timestamp with time zone,
	"participant_phone" varchar(50),
	"participant_address" text,
	"participant_blood_type" varchar(10),
	"participant_province_id" uuid,
	"participant_regency_id" uuid,
	"participant_district_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_training_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_province_id_provinces_id_fk" FOREIGN KEY ("company_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_regency_id_regencies_id_fk" FOREIGN KEY ("company_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_district_id_districts_id_fk" FOREIGN KEY ("company_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_province_id_provinces_id_fk" FOREIGN KEY ("participant_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_regency_id_regencies_id_fk" FOREIGN KEY ("participant_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_district_id_districts_id_fk" FOREIGN KEY ("participant_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_training_profile_user_id_idx" ON "user_training_profiles" USING btree ("user_id");