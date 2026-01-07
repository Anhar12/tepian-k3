ALTER TABLE "order_status_history" ADD COLUMN "status" "order_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_history" DROP COLUMN "previous_status";--> statement-breakpoint
ALTER TABLE "order_status_history" DROP COLUMN "new_status";