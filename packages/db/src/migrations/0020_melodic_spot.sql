ALTER TABLE "orders" RENAME COLUMN "cover_transportation_included" TO "cover_flight_included";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cover_ground_transportation_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cover_lodging_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_note" text;