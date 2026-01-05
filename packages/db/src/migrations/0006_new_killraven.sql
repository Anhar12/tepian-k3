CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."testing_sequence_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "parameter_tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "testing" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"testing_number" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "testing_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "testing_testing_number_unique" UNIQUE("testing_number")
);
--> statement-breakpoint
CREATE TABLE "testing_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"result" text,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_testing_id_testing_id_fk" FOREIGN KEY ("testing_id") REFERENCES "public"."testing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parameter_tool_id_idx" ON "parameter_tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_tool_parameter_id_idx" ON "parameter_tools" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "parameter_tool_tool_id_idx" ON "parameter_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "testing_id_idx" ON "testing" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_order_number_idx" ON "testing" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "testing_testing_number_idx" ON "testing" USING btree ("testing_number");--> statement-breakpoint
CREATE INDEX "testing_user_id_idx" ON "testing" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "testing_company_id_idx" ON "testing" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "testing_location_id_idx" ON "testing" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "testing_item_id_idx" ON "testing_item" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_item_testing_id_idx" ON "testing_item" USING btree ("testing_id");