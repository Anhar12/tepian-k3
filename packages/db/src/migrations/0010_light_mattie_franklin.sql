ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."action";--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('view', 'create', 'read', 'update', 'delete');--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE "public"."action" USING "action"::"public"."action";