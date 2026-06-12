ALTER TABLE "users" ADD COLUMN "verification_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_rejection_reason" text;