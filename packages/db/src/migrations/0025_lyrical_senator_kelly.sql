DROP INDEX "district_old_id_idx";--> statement-breakpoint
DROP INDEX "district_old_regency_id_idx";--> statement-breakpoint
DROP INDEX "province_old_id_idx";--> statement-breakpoint
DROP INDEX "regency_old_id_idx";--> statement-breakpoint
DROP INDEX "regency_old_province_id_idx";--> statement-breakpoint
DROP INDEX "village_old_id_idx";--> statement-breakpoint
DROP INDEX "village_old_district_id_idx";--> statement-breakpoint
ALTER TABLE "districts" DROP COLUMN "old_id";--> statement-breakpoint
ALTER TABLE "districts" DROP COLUMN "old_regency_id";--> statement-breakpoint
ALTER TABLE "provinces" DROP COLUMN "old_id";--> statement-breakpoint
ALTER TABLE "regencies" DROP COLUMN "old_id";--> statement-breakpoint
ALTER TABLE "regencies" DROP COLUMN "old_province_id";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "old_id";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "old_district_id";