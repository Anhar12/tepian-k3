CREATE TYPE "public"."pelatihan_order_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."attendance_status" ADD VALUE 'visited';--> statement-breakpoint
ALTER TYPE "public"."pelatihan_order_status" ADD VALUE 'waiting_payment' BEFORE 'waiting_verification';--> statement-breakpoint
ALTER TYPE "public"."pelatihan_order_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TYPE "public"."pelatihan_payment_status" ADD VALUE 'pending_verification' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."pelatihan_payment_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" RENAME COLUMN "bimtek_verification_status" TO "verification_status";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" RENAME COLUMN "bimtek_rejection_reason" TO "rejection_reason";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" RENAME COLUMN "bimtek_verified_at" TO "verified_at";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" RENAME COLUMN "bimtek_verified_by" TO "verified_by";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" DROP CONSTRAINT "pelatihan_enrollments_bimtek_verified_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD COLUMN "approval_status" "pelatihan_order_approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD COLUMN "approval_reject_reason" text;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD COLUMN "payment_rejected_reason" text;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ADD CONSTRAINT "pelatihan_enrollments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_orders" ADD CONSTRAINT "pelatihan_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pelatihan_orders_approval_status_idx" ON "pelatihan_orders" USING btree ("approval_status");