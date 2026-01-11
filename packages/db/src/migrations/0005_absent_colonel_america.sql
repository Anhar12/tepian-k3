CREATE TYPE "public"."document_entity_type" AS ENUM('order', 'testing', 'user_company', 'user');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_signature', 'signed', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('offering_document', 'offering_user_document', 'invoice', 'proof_of_payment', 'assignment_letter', 'testing_report', 'lab_certificate', 'sample_analysis', 'calibration_certificate', 'business_license', 'company_registration', 'id_card', 'certification');--> statement-breakpoint
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
	"created_at" timestamp with time zone NOT NULL,
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
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "documents_document_number_unique" UNIQUE("document_number"),
	CONSTRAINT "documents_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
ALTER TABLE "audits" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_verifications_document_id_idx" ON "document_verifications" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_verifications_created_at_idx" ON "document_verifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "documents_id_idx" ON "documents" USING btree ("id");--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_verification_token_idx" ON "documents" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "documents_document_number_idx" ON "documents" USING btree ("document_number");--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "offering_document_url";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "offering_user_document_url";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "invoice_url";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "proof_of_payment_url";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "assignment_letter_url";