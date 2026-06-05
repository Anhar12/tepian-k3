ALTER TABLE "worksheets" ADD COLUMN "offering_letter_number" varchar(250);--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "offering_letter_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "billing_code" varchar(100);--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "billing_expiry_date" timestamp with time zone;