ALTER TABLE "orders" RENAME COLUMN "cover_accommodation_included" TO "cover_water_transportation_included";--> statement-breakpoint
ALTER TABLE "worksheets" RENAME COLUMN "cover_accommodation_included" TO "cover_water_transportation_included";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cover_ground_transportation_to_airport_or_harbour" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "cover_ground_transportation_to_airport_or_harbour" boolean DEFAULT false;