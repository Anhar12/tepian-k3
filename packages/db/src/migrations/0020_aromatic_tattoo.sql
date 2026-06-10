CREATE TYPE "public"."pelatihan_verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TABLE "pelatihan_categories" DROP CONSTRAINT "pelatihan_categories_slug_unique";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ALTER COLUMN "verification_status" SET DEFAULT 'pending'::"public"."pelatihan_verification_status";--> statement-breakpoint
ALTER TABLE "pelatihan_enrollments" ALTER COLUMN "verification_status" SET DATA TYPE "public"."pelatihan_verification_status" USING "verification_status"::"public"."pelatihan_verification_status";--> statement-breakpoint
CREATE UNIQUE INDEX "pelatihan_category_slug_idx" ON "pelatihan_categories" USING btree ("slug") WHERE "pelatihan_categories"."deleted_at" IS NULL;