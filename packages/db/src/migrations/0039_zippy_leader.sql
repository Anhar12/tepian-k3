ALTER TABLE "clusters" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "cluster_sort_order_idx" ON "clusters" USING btree ("sort_order");