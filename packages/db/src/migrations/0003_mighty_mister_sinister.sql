CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "clusters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "parameter_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cluster_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "parameter_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "parameters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_category_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"reference" text,
	"price" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "parameter_categories" ADD CONSTRAINT "parameter_categories_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_parameter_category_id_parameter_categories_id_fk" FOREIGN KEY ("parameter_category_id") REFERENCES "public"."parameter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cluster_id_idx" ON "clusters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "cluster_name_idx" ON "clusters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parameter_category_id_idx" ON "parameter_categories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_category_name_idx" ON "parameter_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parameter_id_idx" ON "parameters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_parameter_category_id_idx" ON "parameters" USING btree ("parameter_category_id");--> statement-breakpoint
CREATE INDEX "parameter_name_idx" ON "parameters" USING btree ("name");