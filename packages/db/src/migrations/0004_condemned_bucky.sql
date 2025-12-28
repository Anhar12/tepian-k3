ALTER TABLE "parameter_categories" DROP CONSTRAINT "parameter_categories_cluster_id_clusters_id_fk";
--> statement-breakpoint
ALTER TABLE "parameters" ADD COLUMN "cluster_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_categories" DROP COLUMN "cluster_id";