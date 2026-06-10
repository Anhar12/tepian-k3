ALTER TYPE "public"."document_type" ADD VALUE 'pass_photo';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'penawaran_review' BEFORE 'penawaran_diterbitkan';--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "offering_letter_number" varchar(250);--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "offering_letter_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "billing_code" varchar(100);--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "billing_expiry_date" timestamp with time zone;