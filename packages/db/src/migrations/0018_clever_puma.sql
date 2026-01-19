ALTER TABLE "worksheets" DROP CONSTRAINT "worksheets_testing_id_testing_id_fk";
--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."worksheet_status";--> statement-breakpoint
CREATE TYPE "public"."worksheet_status" AS ENUM('draft', 'pending_verification', 'verified', 'ready', 'in_progress', 'completed');--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."worksheet_status";--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "status" SET DATA TYPE "public"."worksheet_status" USING "status"::"public"."worksheet_status";--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "testing_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "order_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_testing_id_testing_id_fk" FOREIGN KEY ("testing_id") REFERENCES "public"."testing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_order_id_idx" ON "worksheets" USING btree ("order_id");