ALTER TABLE "parameters" DROP CONSTRAINT "parameters_cluster_id_clusters_id_fk";
--> statement-breakpoint
ALTER TABLE "parameter_categories" ADD COLUMN "cluster_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "parameter_categories" ADD CONSTRAINT "parameter_categories_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parameter_category_cluster_id_idx" ON "parameter_categories" USING btree ("cluster_id");--> statement-breakpoint
ALTER TABLE "parameters" DROP COLUMN "cluster_id";