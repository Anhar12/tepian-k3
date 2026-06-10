ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_name" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_address" text;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_province_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_regency_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_district_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "company_kbli" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_name" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_nik" varchar(50);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_birth_place" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_birth_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_email" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "participant_address" text;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "employment_letter_url" varchar(500);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "employment_letter_name" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "consent_letter_url" varchar(500);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "consent_letter_name" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "diploma_url" varchar(500);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "diploma_name" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "bimtek_verification_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "bimtek_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "bimtek_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD COLUMN "bimtek_verified_by" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_province_id_provinces_id_fk" FOREIGN KEY ("company_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_regency_id_regencies_id_fk" FOREIGN KEY ("company_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_district_id_districts_id_fk" FOREIGN KEY ("company_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_bimtek_verified_by_users_id_fk" FOREIGN KEY ("bimtek_verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;