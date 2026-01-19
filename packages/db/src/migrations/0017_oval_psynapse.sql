ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('offering_document', 'offering_user_document', 'approval_letter', 'approval_letter_user', 'invoice', 'cooperation_agreement', 'cooperation_agreement_user', 'proof_of_payment', 'assignment_letter', 'testing_report', 'lab_certificate', 'sample_analysis', 'calibration_certificate', 'business_license', 'company_registration', 'id_card', 'certification');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE "public"."document_type" USING "type"::"public"."document_type";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cover_transportation_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cover_accommodation_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "cover_transportation_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "cover_accommodation_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "note" text;