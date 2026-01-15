ALTER TABLE "worksheets" RENAME COLUMN "user_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "worksheets" DROP CONSTRAINT "worksheets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."action";--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('create', 'read', 'update', 'delete', 'view');--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE "public"."action" USING "action"::"public"."action";--> statement-breakpoint
DROP INDEX "worksheet_user_id_idx";--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worksheet_created_by_idx" ON "worksheets" USING btree ("created_by");