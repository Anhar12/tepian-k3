CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'status_change');--> statement-breakpoint
CREATE TYPE "public"."document_entity_type" AS ENUM('order', 'testing', 'user_company', 'user', 'worksheet_assignment', 'worksheet');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_signature', 'signed', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('offering_document', 'offering_user_document', 'approval_letter', 'approval_letter_user', 'invoice', 'cooperation_agreement', 'cooperation_agreement_user', 'proof_of_payment', 'assignment_letter', 'testing_report', 'lab_certificate', 'sample_analysis', 'calibration_certificate', 'business_license', 'company_registration', 'id_card', 'certification');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('siap', 'spt', 'standby', 'cuti');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_status_changed', 'payment_received', 'payment_rejected', 'testing_started', 'testing_completed', 'document_ready', 'document_signed', 'assignment_received', 'system_announcement', 'general');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('view', 'create', 'read', 'update', 'delete', 'review', 'verify', 'approve');--> statement-breakpoint
CREATE TYPE "public"."bahan_status" AS ENUM('tersedia', 'hampir_habis', 'habis', 'expired', 'dipesan');--> statement-breakpoint
CREATE TYPE "public"."bahan_unit" AS ENUM('gram', 'kg', 'botol', 'ml', 'liter');--> statement-breakpoint
CREATE TYPE "public"."tools_availability" AS ENUM('ready', 'kalibrasi', 'not_ready', 'maintenance', 'dipinjam');--> statement-breakpoint
CREATE TYPE "public"."tools_condition" AS ENUM('baik', 'rusak', 'diperingatkan', 'tidak_menyala');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'kaji_ulang', 'kaji_ulang_disetujui', 'penawaran_diterbitkan', 'revision', 'upload_surat_persetujuan', 'surat_persetujuan_diproses', 'persetujuan_disetujui', 'tagihan_diterbitkan', 'proses_validasi_pembayaran', 'pembayaran_diterima', 'menunggu_penerbitan_spt_jadwal', 'proses_pengambilan_sampel', 'sampel_dalam_proses_penyerahan', 'sampel_telah_dianalisis', 'sampel_selesai_dianalisis', 'laporan_diterbitkan', 'completed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'pending_verification', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."testing_status" AS ENUM('start_testing', 'sample_submission', 'sample_analysis', 'report_generation', 'report_publishing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."worksheet_note_status" AS ENUM('info', 'warning', 'danger', 'success', 'important', 'question', 'urgent', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."worksheet_status" AS ENUM('draft', 'pending_verification', 'revision', 'verified', 'ready', 'in_progress', 'completed', 'rejected');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."testing_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"metadata" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"banner_url" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"regency_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_signatures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"signed_by_user_id" uuid NOT NULL,
	"signer_name" varchar(255) NOT NULL,
	"signer_email" varchar(255),
	"purpose" text NOT NULL,
	"signature_order" integer,
	"qr_code_position" jsonb NOT NULL,
	"verification_token" varchar(255) NOT NULL,
	"verification_url" text NOT NULL,
	"signature_data" text NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "document_signatures_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "document_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"verified_by_user_id" uuid,
	"verified_by_ip" varchar(45),
	"verified_by_user_agent" text,
	"verification_location" text,
	"is_valid" boolean NOT NULL,
	"verification_method" varchar(50),
	"verification_notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_number" varchar(100) NOT NULL,
	"type" "document_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"entity_type" "document_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"signature_data" text,
	"qr_code_url" text,
	"verification_token" varchar(255),
	"verification_url" text,
	"uploaded_by_user_id" uuid NOT NULL,
	"signed_by_user_id" uuid,
	"signed_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "documents_document_number_unique" UNIQUE("document_number"),
	CONSTRAINT "documents_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
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
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"position_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"email" varchar(250) NOT NULL,
	"type" text NOT NULL,
	"nip" varchar(100) NOT NULL,
	"status" "employee_status" DEFAULT 'siap' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "employees_email_unique" UNIQUE("email"),
	CONSTRAINT "employees_nip_unique" UNIQUE("nip")
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'general' NOT NULL,
	"title" varchar(250) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"order_id" uuid,
	"testing_id" uuid,
	"document_id" uuid,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"email" varchar(250) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" "action" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "positions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"device_info" text,
	"os" text,
	"version" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "regencies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"province_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"password" varchar(150) NOT NULL,
	"email" varchar(250) NOT NULL,
	"name" varchar(250) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"profile_picture_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_email_unique_idx" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"district_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "chemical_materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "clusters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "kblis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approval_reject_reason" text,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_rejected_reason" text,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"revision_notes" text,
	"cover_flight_included" boolean DEFAULT false,
	"cover_ground_transportation_included" boolean DEFAULT false,
	"cover_lodging_included" boolean DEFAULT false,
	"cover_accommodation_included" boolean DEFAULT false,
	"customer_note" text,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"arrival_date" timestamp with time zone,
	"departure_date" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"sub_total" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parameter_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cluster_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "parameter_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "parameter_chemical_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_id" uuid NOT NULL,
	"chemical_material_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parameter_tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parameters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_category_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"reference" text,
	"price" integer NOT NULL,
	"unit" varchar(255) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "survey_feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"feedback" text,
	"submitted_at" timestamp with time zone NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "survey_feedback_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"rating" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "testing" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_number" varchar(100) NOT NULL,
	"order_id" uuid NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"testing_type" uuid NOT NULL,
	"status" "testing_status" DEFAULT 'start_testing' NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "testing_testing_number_unique" UNIQUE("testing_number")
);
--> statement-breakpoint
CREATE TABLE "testing_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"sub_total" integer NOT NULL,
	"result" text,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_calibration_certificates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_calibration_id" uuid NOT NULL,
	"certificate_file_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_calibration_documentations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_calibration_id" uuid NOT NULL,
	"documentation_file_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_calibrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_id" uuid NOT NULL,
	"calibration_date" timestamp with time zone NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_checks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_id" uuid NOT NULL,
	"checked_by" uuid NOT NULL,
	"check_alat_menyala" boolean NOT NULL,
	"check_penyimpangan" boolean NOT NULL,
	"check_kelengkapan_alat" boolean NOT NULL,
	"check_kondisi_fisik_alat" boolean NOT NULL,
	"check_condition_result" "tools_condition" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tool_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(256) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "tool_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_code_id" uuid NOT NULL,
	"tool_unique_code" varchar(256) NOT NULL,
	"tool_name" varchar(256) NOT NULL,
	"function" text,
	"location" text,
	"shelf" text,
	"bmn_number" varchar(100),
	"nup_number" varchar(100),
	"brand" varchar(256),
	"type" varchar(256),
	"serial_number" varchar(256),
	"origin_of_acquisition" text,
	"acquisition_year" integer,
	"correction" text,
	"condition" "tools_condition" NOT NULL,
	"availability" "tools_availability" NOT NULL,
	"information" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"kbli_id" uuid NOT NULL,
	"address" text NOT NULL,
	"maleWorkers" integer DEFAULT 0 NOT NULL,
	"femaleWorkers" integer DEFAULT 0 NOT NULL,
	"healthFacilityAvailable" boolean DEFAULT false NOT NULL,
	"provinceId" uuid NOT NULL,
	"districtId" uuid NOT NULL,
	"regencyId" uuid NOT NULL,
	"villageId" uuid NOT NULL,
	"responsible_testing_person" varchar(250) NOT NULL,
	"responsible_testing_person_phone" varchar(50) NOT NULL,
	"responsible_testing_person_email" varchar(250) NOT NULL,
	"email" varchar(250) NOT NULL,
	"wlkp_status" boolean DEFAULT false NOT NULL,
	"wlkp" text,
	"company_bank_name" varchar(250) NOT NULL,
	"company_bank_account" varchar(100) NOT NULL,
	"company_bank_account_name" varchar(250) NOT NULL,
	"company_picture_url" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_company_testing_locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"regency_id" uuid NOT NULL,
	"district_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_chemical_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"chemical_material_id" uuid NOT NULL,
	"required" real DEFAULT 0 NOT NULL,
	"required_unit" "bahan_unit",
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"note" text,
	"is_ready" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_operational_costs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"item" varchar(255) NOT NULL,
	"unit_count" integer DEFAULT 1 NOT NULL,
	"days" integer DEFAULT 1 NOT NULL,
	"unit_cost" integer,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_tool_needed" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"tool_needed" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheet_tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worksheet_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"borrowed_by" uuid NOT NULL,
	"returned_by" uuid,
	"returned_at" timestamp with time zone,
	"check_alat_menyala" boolean,
	"check_penyimpangan" boolean,
	"check_kelengkapan_alat" boolean,
	"check_kondisi_fisik_alat" boolean,
	"check_condition_result" "tools_condition",
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worksheets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "worksheet_status" DEFAULT 'draft' NOT NULL,
	"estimated_amount_of_members" integer DEFAULT 0 NOT NULL,
	"estimated_amount_of_days" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"main_supervisor_id" uuid,
	"accompanying_supervisor_id" uuid,
	"result" text,
	"cover_flight_included" boolean DEFAULT false,
	"cover_ground_transportation_included" boolean DEFAULT false,
	"cover_lodging_included" boolean DEFAULT false,
	"cover_accommodation_included" boolean DEFAULT false,
	"note" text,
	"created_by" uuid NOT NULL,
	"is_personnel_date_set" boolean DEFAULT false NOT NULL,
	"revision_notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_regencies_id_fk" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_categories" ADD CONSTRAINT "parameter_categories_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_chemical_materials" ADD CONSTRAINT "parameter_chemical_materials_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_chemical_materials" ADD CONSTRAINT "parameter_chemical_materials_chemical_material_id_chemical_materials_id_fk" FOREIGN KEY ("chemical_material_id") REFERENCES "public"."chemical_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_parameter_category_id_parameter_categories_id_fk" FOREIGN KEY ("parameter_category_id") REFERENCES "public"."parameter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_feedback" ADD CONSTRAINT "survey_feedback_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_feedback" ADD CONSTRAINT "survey_feedback_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_testing_type_parameter_categories_id_fk" FOREIGN KEY ("testing_type") REFERENCES "public"."parameter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_testing_id_testing_id_fk" FOREIGN KEY ("testing_id") REFERENCES "public"."testing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calibration_certificates" ADD CONSTRAINT "tool_calibration_certificates_tool_calibration_id_tool_calibrations_id_fk" FOREIGN KEY ("tool_calibration_id") REFERENCES "public"."tool_calibrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calibration_documentations" ADD CONSTRAINT "tool_calibration_documentations_tool_calibration_id_tool_calibrations_id_fk" FOREIGN KEY ("tool_calibration_id") REFERENCES "public"."tool_calibrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calibrations" ADD CONSTRAINT "tool_calibrations_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_checks" ADD CONSTRAINT "tool_checks_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_checks" ADD CONSTRAINT "tool_checks_checked_by_employees_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tool_code_id_tool_codes_id_fk" FOREIGN KEY ("tool_code_id") REFERENCES "public"."tool_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_kbli_id_kblis_id_fk" FOREIGN KEY ("kbli_id") REFERENCES "public"."kblis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_provinceId_provinces_id_fk" FOREIGN KEY ("provinceId") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_districtId_districts_id_fk" FOREIGN KEY ("districtId") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_regencyId_regencies_id_fk" FOREIGN KEY ("regencyId") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_villageId_villages_id_fk" FOREIGN KEY ("villageId") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_user_company_id_user_companies_id_fk" FOREIGN KEY ("user_company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_regency_id_regencies_id_fk" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_assignments" ADD CONSTRAINT "worksheet_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_chemical_materials" ADD CONSTRAINT "worksheet_chemical_materials_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_chemical_materials" ADD CONSTRAINT "worksheet_chemical_materials_chemical_material_id_chemical_materials_id_fk" FOREIGN KEY ("chemical_material_id") REFERENCES "public"."chemical_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_items" ADD CONSTRAINT "worksheet_items_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_notes" ADD CONSTRAINT "worksheet_notes_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_notes" ADD CONSTRAINT "worksheet_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD CONSTRAINT "worksheet_operational_costs_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tool_needed" ADD CONSTRAINT "worksheet_tool_needed_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tool_needed" ADD CONSTRAINT "worksheet_tool_needed_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_borrowed_by_employees_id_fk" FOREIGN KEY ("borrowed_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_tools" ADD CONSTRAINT "worksheet_tools_returned_by_employees_id_fk" FOREIGN KEY ("returned_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_main_supervisor_id_employees_id_fk" FOREIGN KEY ("main_supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_accompanying_supervisor_id_employees_id_fk" FOREIGN KEY ("accompanying_supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_type_id_idx" ON "audits" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_user_id_idx" ON "audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audits" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audits" USING btree ("created_at" desc);--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "audits" USING btree ("entity_type","entity_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "audits_changed_fields_idx" ON "audits" USING gin ("changed_fields");--> statement-breakpoint
CREATE INDEX "banner_id_idx" ON "banners" USING btree ("id");--> statement-breakpoint
CREATE INDEX "banner_order_idx" ON "banners" USING btree ("order");--> statement-breakpoint
CREATE INDEX "banner_is_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "district_name_idx" ON "districts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "district_regency_id_idx" ON "districts" USING btree ("regency_id");--> statement-breakpoint
CREATE INDEX "document_signatures_document_id_idx" ON "document_signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_signatures_signed_by_idx" ON "document_signatures" USING btree ("signed_by_user_id");--> statement-breakpoint
CREATE INDEX "document_signatures_verification_token_idx" ON "document_signatures" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "document_signatures_created_at_idx" ON "document_signatures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_verifications_document_id_idx" ON "document_verifications" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_verifications_created_at_idx" ON "document_verifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "documents_id_idx" ON "documents" USING btree ("id");--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_verification_token_idx" ON "documents" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "documents_document_number_idx" ON "documents" USING btree ("document_number");--> statement-breakpoint
CREATE INDEX "employee_certification_id_idx" ON "employee_certifications" USING btree ("id");--> statement-breakpoint
CREATE INDEX "employee_certification_employee_id_idx" ON "employee_certifications" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_id_idx" ON "employees" USING btree ("id");--> statement-breakpoint
CREATE INDEX "employee_user_id_idx" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "employee_email_idx" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "news_id_idx" ON "news" USING btree ("id");--> statement-breakpoint
CREATE INDEX "news_is_published_idx" ON "news" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "otp_code_user_id_idx" ON "otp_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "otp_code_email_idx" ON "otp_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "permission_name_resource_action_idx" ON "permissions" USING btree ("name","resource","action");--> statement-breakpoint
CREATE INDEX "position_name_idx" ON "positions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "province_name_idx" ON "provinces" USING btree ("name");--> statement-breakpoint
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_token_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "regency_name_idx" ON "regencies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "regency_province_id_idx" ON "regencies" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "role_permission_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_permission_user_id_idx" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_permission_id_idx" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "user_role_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "email_deleted_at_unique_idx" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "village_name_idx" ON "villages" USING btree ("name");--> statement-breakpoint
CREATE INDEX "village_district_id_idx" ON "villages" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "cart_user_id_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_company_id_idx" ON "cart" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cart_location_id_idx" ON "cart" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "cart_parameter_id_idx" ON "cart" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "chemical_material_id_idx" ON "chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "chemical_material_code_idx" ON "chemical_materials" USING btree ("code");--> statement-breakpoint
CREATE INDEX "chemical_material_name_idx" ON "chemical_materials" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cluster_id_idx" ON "clusters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "cluster_name_idx" ON "clusters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "kbli_id_idx" ON "kblis" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_id_idx" ON "orders" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_company_id_idx" ON "orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_approval_status_idx" ON "orders" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "order_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "order_item_id_idx" ON "order_items" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_id_idx" ON "order_status_history" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "parameter_category_id_idx" ON "parameter_categories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_category_cluster_id_idx" ON "parameter_categories" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "parameter_category_name_idx" ON "parameter_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_id_idx" ON "parameter_chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_parameter_id_idx" ON "parameter_chemical_materials" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "parameter_chemical_material_chemical_material_id_idx" ON "parameter_chemical_materials" USING btree ("chemical_material_id");--> statement-breakpoint
CREATE INDEX "parameter_tool_id_idx" ON "parameter_tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_tool_parameter_id_idx" ON "parameter_tools" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "parameter_tool_tool_id_idx" ON "parameter_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "parameter_id_idx" ON "parameters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_parameter_category_id_idx" ON "parameters" USING btree ("parameter_category_id");--> statement-breakpoint
CREATE INDEX "parameter_name_idx" ON "parameters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "survey_feedback_id_idx" ON "survey_feedback" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_feedback_order_id_idx" ON "survey_feedback" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "survey_question_id_idx" ON "survey_questions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_question_order_idx" ON "survey_questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "survey_question_is_active_idx" ON "survey_questions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "survey_response_id_idx" ON "survey_responses" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_response_order_id_idx" ON "survey_responses" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "survey_response_question_id_idx" ON "survey_responses" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_order_question_unique_idx" ON "survey_responses" USING btree ("order_id","question_id");--> statement-breakpoint
CREATE INDEX "testing_id_idx" ON "testing" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_testing_number_idx" ON "testing" USING btree ("testing_number");--> statement-breakpoint
CREATE INDEX "testing_testing_type_idx" ON "testing" USING btree ("testing_type");--> statement-breakpoint
CREATE INDEX "testing_user_id_idx" ON "testing" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "testing_company_id_idx" ON "testing" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "testing_item_id_idx" ON "testing_item" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_item_testing_id_idx" ON "testing_item" USING btree ("testing_id");--> statement-breakpoint
CREATE INDEX "testing_item_parameter_id_idx" ON "testing_item" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "tool_calibration_certificate_id_idx" ON "tool_calibration_certificates" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_certificate_tool_calibration_id_idx" ON "tool_calibration_certificates" USING btree ("tool_calibration_id");--> statement-breakpoint
CREATE INDEX "tool_calibration_documentation_id_idx" ON "tool_calibration_documentations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_documentation_tool_calibration_id_idx" ON "tool_calibration_documentations" USING btree ("tool_calibration_id");--> statement-breakpoint
CREATE INDEX "tool_calibration_id_idx" ON "tool_calibrations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_calibration_tool_id_idx" ON "tool_calibrations" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_check_id_idx" ON "tool_checks" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_check_tool_id_idx" ON "tool_checks" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_check_checked_by_idx" ON "tool_checks" USING btree ("checked_by");--> statement-breakpoint
CREATE INDEX "tool_code_id_idx" ON "tool_codes" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_code_code_idx" ON "tool_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "tool_code_is_active_idx" ON "tool_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tool_id_idx" ON "tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_tool_code_id_idx" ON "tools" USING btree ("tool_code_id");--> statement-breakpoint
CREATE INDEX "tool_tool_unique_code_idx" ON "tools" USING btree ("tool_unique_code");--> statement-breakpoint
CREATE INDEX "user_company_id_idx" ON "user_companies" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_company_user_id_idx" ON "user_companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_company_testing_location_id_idx" ON "user_company_testing_locations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_company_testing_location_user_company_id_idx" ON "user_company_testing_locations" USING btree ("user_company_id");--> statement-breakpoint
CREATE INDEX "worksheet_assignment_id_idx" ON "worksheet_assignments" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_assignment_worksheet_id_idx" ON "worksheet_assignments" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_assignment_employee_id_idx" ON "worksheet_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_id_idx" ON "worksheet_chemical_materials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_worksheet_id_idx" ON "worksheet_chemical_materials" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_chemical_material_chemical_material_id_idx" ON "worksheet_chemical_materials" USING btree ("chemical_material_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_id_idx" ON "worksheet_items" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_item_worksheet_id_idx" ON "worksheet_items" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_parameter_id_idx" ON "worksheet_items" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "worksheet_item_location_id_idx" ON "worksheet_items" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "worksheet_note_id_idx" ON "worksheet_notes" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_note_worksheet_id_idx" ON "worksheet_notes" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_operational_cost_id_idx" ON "worksheet_operational_costs" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_operational_cost_worksheet_id_idx" ON "worksheet_operational_costs" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_id_idx" ON "worksheet_tool_needed" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_worksheet_id_idx" ON "worksheet_tool_needed" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_needed_tool_id_idx" ON "worksheet_tool_needed" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_id_idx" ON "worksheet_tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_worksheet_id_idx" ON "worksheet_tools" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_tool_id_idx" ON "worksheet_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "worksheet_tool_borrowed_by_idx" ON "worksheet_tools" USING btree ("borrowed_by");--> statement-breakpoint
CREATE INDEX "worksheet_id_idx" ON "worksheets" USING btree ("id");--> statement-breakpoint
CREATE INDEX "worksheet_order_id_idx" ON "worksheets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "worksheet_status_idx" ON "worksheets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worksheet_main_supervisor_id_idx" ON "worksheets" USING btree ("main_supervisor_id");--> statement-breakpoint
CREATE INDEX "worksheet_accompanying_supervisor_id_idx" ON "worksheets" USING btree ("accompanying_supervisor_id");--> statement-breakpoint
CREATE INDEX "worksheet_created_by_idx" ON "worksheets" USING btree ("created_by");