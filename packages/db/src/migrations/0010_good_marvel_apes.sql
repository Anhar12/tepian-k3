ALTER TABLE "pelatihan" ADD COLUMN "start_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "end_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "location" varchar(250);--> statement-breakpoint
ALTER TABLE "pelatihan" ADD COLUMN "facilities" varchar(250)[];