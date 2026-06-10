CREATE TYPE "public"."order_item_type" AS ENUM('pengujian', 'pelatihan');--> statement-breakpoint
CREATE TYPE "public"."assessment_type" AS ENUM('pre_test', 'post_test', 'quiz');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted', 'graded', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused', 'sick', 'visited');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('enrolled', 'in_progress', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('ppt', 'pdf', 'video', 'document', 'link');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_order_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_order_status" AS ENUM('pending', 'waiting_payment', 'waiting_verification', 'verified', 'cancelled', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_payment_status" AS ENUM('unpaid', 'pending', 'pending_verification', 'paid', 'refunded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_type" AS ENUM('elearning', 'bimtek', 'webinar');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'essay');--> statement-breakpoint
CREATE TYPE "public"."pelatihan_verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'employment_letter';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'salary_slip';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'employment_contract';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'diploma';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'pass_photo';--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(100) DEFAULT 'general' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(250) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(250) NOT NULL,
	"slug" varchar(250) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"category_id" uuid,
	"level" "pelatihan_level",
	"type" "pelatihan_type" DEFAULT 'elearning' NOT NULL,
	"duration" integer NOT NULL,
	"capacity" integer,
	"price" integer DEFAULT 0 NOT NULL,
	"discount_price" integer,
	"prerequisite_ids" uuid[],
	"minimum_score" integer DEFAULT 70 NOT NULL,
	"status" "pelatihan_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"thumbnail_url" varchar(500),
	"instructor_name" varchar(250),
	"instructor_bio" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"location" varchar(250),
	"facilities" varchar(250)[],
	"requirements" text,
	"dynamic_requirements" jsonb DEFAULT '{}'::jsonb,
	"certificate_number_format" varchar(250),
	"attendance_required" boolean DEFAULT true NOT NULL,
	"min_attendance_percentage" integer DEFAULT 85 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "pelatihan_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pelatihan_assessment_answers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"feedback" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_assessment_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score" integer,
	"total_points" integer,
	"earned_points" integer,
	"passed" boolean,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_assessments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"type" "assessment_type" NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"time_limit" integer,
	"max_attempts" integer,
	"randomize_questions" boolean DEFAULT false NOT NULL,
	"randomize_options" boolean DEFAULT false NOT NULL,
	"available_after" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_attendances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_cart" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"discount_price" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"slug" varchar(250) NOT NULL,
	"description" text,
	"icon_url" varchar(500),
	"order_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
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
CREATE TABLE "pelatihan_certificates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"template_id" uuid,
	"certificate_number" varchar(100) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"document_id" uuid,
	"document_url" varchar(500) NOT NULL,
	"verification_token" text NOT NULL,
	"qr_code_url" varchar(500),
	"instructor_name" varchar(250),
	"final_score" integer NOT NULL,
	"completion_date" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "pelatihan_certificates_enrollment_id_unique" UNIQUE("enrollment_id"),
	CONSTRAINT "pelatihan_certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "pelatihan_enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'enrolled' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"order_id" uuid,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"certificate_url" varchar(500),
	"certificate_issued_at" timestamp with time zone,
	"pre_test_score" integer,
	"post_test_score" integer,
	"final_score" integer,
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
	"participant_email" varchar(250),
	"participant_phone" varchar(50),
	"participant_address" text,
	"employment_letter_url" varchar(500),
	"employment_letter_name" varchar(250),
	"consent_letter_url" varchar(500),
	"consent_letter_name" varchar(250),
	"diploma_url" varchar(500),
	"diploma_name" varchar(250),
	"pass_photo_url" varchar(500),
	"pass_photo_name" varchar(250),
	"verification_status" "pelatihan_verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"module_id" uuid,
	"title" varchar(250) NOT NULL,
	"description" text,
	"type" "material_type" NOT NULL,
	"file_url" varchar(500),
	"file_size" integer,
	"mime_type" varchar(100),
	"duration" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_preview" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
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
CREATE TABLE "pelatihan_order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" "pelatihan_order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"approval_status" "pelatihan_order_approval_status" DEFAULT 'pending' NOT NULL,
	"approval_reject_reason" text,
	"payment_status" "pelatihan_payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_rejected_reason" text,
	"payment_proof_url" varchar(500),
	"payment_proof_uploaded_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "pelatihan_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "pelatihan_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"watched_duration" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_question_options" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"assessment_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"type" "question_type" NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"correct_answer" text,
	"explanation" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text,
	"session_date" timestamp with time zone NOT NULL,
	"start_time" varchar(50) NOT NULL,
	"end_time" varchar(50) NOT NULL,
	"room" varchar(250),
	"category" varchar(100),
	"material_url" varchar(500),
	"meet_url" varchar(500),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
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
ALTER TABLE "orders" ALTER COLUMN "company_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "parameter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "location_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "type" "order_item_type" DEFAULT 'pengujian' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "pelatihan_id" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan" ADD CONSTRAINT "pelatihan_category_id_pelatihan_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."pelatihan_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessment_answers" ADD CONSTRAINT "pelatihan_assessment_answers_attempt_id_pelatihan_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."pelatihan_assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessment_answers" ADD CONSTRAINT "pelatihan_assessment_answers_question_id_pelatihan_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."pelatihan_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessment_answers" ADD CONSTRAINT "pelatihan_assessment_answers_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessment_attempts" ADD CONSTRAINT "pelatihan_assessment_attempts_enrollment_id_pelatihan_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."pelatihan_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessment_attempts" ADD CONSTRAINT "pelatihan_assessment_attempts_assessment_id_pelatihan_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."pelatihan_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_assessments" ADD CONSTRAINT "pelatihan_assessments_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_attendances" ADD CONSTRAINT "pelatihan_attendances_enrollment_id_pelatihan_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."pelatihan_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_attendances" ADD CONSTRAINT "pelatihan_attendances_schedule_id_pelatihan_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."pelatihan_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_cart" ADD CONSTRAINT "pelatihan_cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_cart" ADD CONSTRAINT "pelatihan_cart_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificate_templates" ADD CONSTRAINT "pelatihan_certificate_templates_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificate_templates" ADD CONSTRAINT "pelatihan_certificate_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_enrollment_id_pelatihan_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."pelatihan_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_template_id_pelatihan_certificate_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."pelatihan_certificate_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_certificates" ADD CONSTRAINT "pelatihan_certificates_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_order_id_pelatihan_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pelatihan_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_province_id_provinces_id_fk" FOREIGN KEY ("company_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_regency_id_regencies_id_fk" FOREIGN KEY ("company_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_company_district_id_districts_id_fk" FOREIGN KEY ("company_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_materials" ADD CONSTRAINT "pelatihan_materials_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_materials" ADD CONSTRAINT "pelatihan_materials_module_id_pelatihan_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."pelatihan_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_modules" ADD CONSTRAINT "pelatihan_modules_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_order_items" ADD CONSTRAINT "pelatihan_order_items_order_id_pelatihan_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pelatihan_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_order_items" ADD CONSTRAINT "pelatihan_order_items_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD CONSTRAINT "pelatihan_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD CONSTRAINT "pelatihan_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD CONSTRAINT "pelatihan_orders_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_progress" ADD CONSTRAINT "pelatihan_progress_enrollment_id_pelatihan_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."pelatihan_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_progress" ADD CONSTRAINT "pelatihan_progress_material_id_pelatihan_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."pelatihan_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_question_options" ADD CONSTRAINT "pelatihan_question_options_question_id_pelatihan_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."pelatihan_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_questions" ADD CONSTRAINT "pelatihan_questions_assessment_id_pelatihan_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."pelatihan_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_schedules" ADD CONSTRAINT "pelatihan_schedules_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_province_id_provinces_id_fk" FOREIGN KEY ("company_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_regency_id_regencies_id_fk" FOREIGN KEY ("company_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_company_district_id_districts_id_fk" FOREIGN KEY ("company_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_province_id_provinces_id_fk" FOREIGN KEY ("participant_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_regency_id_regencies_id_fk" FOREIGN KEY ("participant_regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_training_profiles" ADD CONSTRAINT "user_training_profiles_participant_district_id_districts_id_fk" FOREIGN KEY ("participant_district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faq_id_idx" ON "faqs" USING btree ("id");--> statement-breakpoint
CREATE INDEX "faq_category_idx" ON "faqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_is_active_idx" ON "faqs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_unique_idx" ON "settings" USING btree ("key") WHERE "settings"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "settings_id_idx" ON "settings" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "pelatihan_slug_idx" ON "pelatihan" USING btree ("slug") WHERE "pelatihan"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "answer_attempt_question_idx" ON "pelatihan_assessment_answers" USING btree ("attempt_id","question_id") WHERE "pelatihan_assessment_answers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_enrollment_schedule_idx" ON "pelatihan_attendances" USING btree ("enrollment_id","schedule_id") WHERE "pelatihan_attendances"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_user_pelatihan_idx" ON "pelatihan_cart" USING btree ("user_id","pelatihan_id") WHERE "pelatihan_cart"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pelatihan_category_slug_idx" ON "pelatihan_categories" USING btree ("slug") WHERE "pelatihan_categories"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "cert_template_pelatihan_idx" ON "pelatihan_certificate_templates" USING btree ("pelatihan_id");--> statement-breakpoint
CREATE INDEX "cert_template_active_idx" ON "pelatihan_certificate_templates" USING btree ("pelatihan_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_number_idx" ON "pelatihan_certificates" USING btree ("certificate_number") WHERE "pelatihan_certificates"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_user_pelatihan_idx" ON "pelatihan_enrollments" USING btree ("user_id","pelatihan_id") WHERE "pelatihan_enrollments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "pelatihan_orders_user_idx" ON "pelatihan_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pelatihan_orders_status_idx" ON "pelatihan_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pelatihan_orders_approval_status_idx" ON "pelatihan_orders" USING btree ("approval_status");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_enrollment_material_idx" ON "pelatihan_progress" USING btree ("enrollment_id","material_id") WHERE "pelatihan_progress"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_training_profile_user_id_idx" ON "user_training_profiles" USING btree ("user_id");