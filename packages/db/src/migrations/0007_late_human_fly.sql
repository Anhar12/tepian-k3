ALTER TABLE "employees" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nip" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_nip_unique" UNIQUE("nip");