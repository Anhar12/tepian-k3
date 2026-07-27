CREATE TYPE "public"."operational_cost_verification_status" AS ENUM('draft', 'submitted', 'verified', 'revised');--> statement-breakpoint
CREATE TYPE "public"."order_funding_type" AS ENUM('pnbp', 'dipa');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "funding_type" "order_funding_type" DEFAULT 'pnbp' NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD COLUMN "verification_status" "operational_cost_verification_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD COLUMN "sbm_year" integer;--> statement-breakpoint
ALTER TABLE "worksheet_operational_costs" ADD CONSTRAINT "worksheet_operational_costs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;