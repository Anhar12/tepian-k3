CREATE TYPE "public"."tools_availability" AS ENUM('ready', 'kalibrasi', 'not_ready', 'maintenance', 'dipinjam');--> statement-breakpoint
CREATE TYPE "public"."tools_condition" AS ENUM('baik', 'rusak', 'diperingatkan', 'tidak_menyala');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'revision', 'rejected', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'pending_verification', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('create', 'read', 'update', 'delete', 'manage');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."testing_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
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
CREATE TABLE "districts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"old_id" bigserial NOT NULL,
	"old_regency_id" bigserial NOT NULL,
	"regency_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kblis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"offering_document_file_name" text,
	"offering_document_url" text,
	"offering_user_document_file_name" text,
	"offering_user_document_url" text,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approval_reject_reason" text,
	"invoice_file_name" text,
	"invoice_url" text,
	"proof_of_payment_file_name" text,
	"proof_of_payment_url" text,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_rejected_reason" text,
	"assignment_letter_file_name" text,
	"assignment_letter_url" text,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"sub_total" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"previous_status" "order_status" NOT NULL,
	"new_status" "order_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"email" varchar(250) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL
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
CREATE TABLE "parameter_tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parameters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parameter_category_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"reference" text,
	"price" integer NOT NULL,
	"unit" varchar(255) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" "action" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"old_id" bigserial NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regencies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"old_id" bigserial NOT NULL,
	"province_id" uuid NOT NULL,
	"old_province_id" bigserial NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "testing" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_number" varchar(100) NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"testing_type" uuid NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "testing_testing_number_unique" UNIQUE("testing_number")
);
--> statement-breakpoint
CREATE TABLE "testing_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"testing_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"parameter_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"sub_total" integer NOT NULL,
	"result" text,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_code" varchar(256) NOT NULL,
	"tool_name" varchar(256) NOT NULL,
	"function" text,
	"location" text,
	"shelf" text,
	"bmn_number" varchar(100),
	"nup_number" varchar(100),
	"brand" varchar(256),
	"type" varchar(256),
	"serial_number" varchar(256),
	"origin_of_acquisition" text,
	"acquisition_year" integer,
	"correction" text,
	"condition" "tools_condition" NOT NULL,
	"availability" "tools_availability" NOT NULL,
	"information" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "tools_tool_code_unique" UNIQUE("tool_code")
);
--> statement-breakpoint
CREATE TABLE "user_companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"kbli_id" uuid NOT NULL,
	"address" text NOT NULL,
	"maleWorkers" integer DEFAULT 0 NOT NULL,
	"femaleWorkers" integer DEFAULT 0 NOT NULL,
	"healthFacilityAvailable" boolean DEFAULT false NOT NULL,
	"provinceId" uuid NOT NULL,
	"districtId" uuid NOT NULL,
	"regencyId" uuid NOT NULL,
	"villageId" uuid NOT NULL,
	"responsible_testing_person" varchar(250) NOT NULL,
	"responsible_testing_person_phone" varchar(50) NOT NULL,
	"responsible_testing_person_email" varchar(250) NOT NULL,
	"email" varchar(250) NOT NULL,
	"wlkp_status" boolean DEFAULT false NOT NULL,
	"wlkp" text NOT NULL,
	"company_picture_file_name" text NOT NULL,
	"company_picture_url" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_company_testing_locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"regency_id" uuid NOT NULL,
	"district_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"password" varchar(150) NOT NULL,
	"email" varchar(250) NOT NULL,
	"name" varchar(250) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"profile_picture_file_name" text,
	"profile_picture_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_email_unique_idx" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"old_id" bigserial NOT NULL,
	"old_district_id" bigserial NOT NULL,
	"district_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_regencies_id_fk" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_categories" ADD CONSTRAINT "parameter_categories_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_tools" ADD CONSTRAINT "parameter_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_parameter_category_id_parameter_categories_id_fk" FOREIGN KEY ("parameter_category_id") REFERENCES "public"."parameter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_company_id_user_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing" ADD CONSTRAINT "testing_testing_type_parameter_categories_id_fk" FOREIGN KEY ("testing_type") REFERENCES "public"."parameter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_testing_id_testing_id_fk" FOREIGN KEY ("testing_id") REFERENCES "public"."testing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_item" ADD CONSTRAINT "testing_item_location_id_user_company_testing_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."user_company_testing_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_kbli_id_kblis_id_fk" FOREIGN KEY ("kbli_id") REFERENCES "public"."kblis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_provinceId_provinces_id_fk" FOREIGN KEY ("provinceId") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_districtId_districts_id_fk" FOREIGN KEY ("districtId") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_regencyId_regencies_id_fk" FOREIGN KEY ("regencyId") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_villageId_villages_id_fk" FOREIGN KEY ("villageId") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_user_company_id_user_companies_id_fk" FOREIGN KEY ("user_company_id") REFERENCES "public"."user_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_regency_id_regencies_id_fk" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_testing_locations" ADD CONSTRAINT "user_company_testing_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_user_id_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_company_id_idx" ON "cart" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cart_location_id_idx" ON "cart" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "cart_parameter_id_idx" ON "cart" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "cluster_id_idx" ON "clusters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "cluster_name_idx" ON "clusters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "district_name_idx" ON "districts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "district_regency_id_idx" ON "districts" USING btree ("regency_id");--> statement-breakpoint
CREATE INDEX "district_old_id_idx" ON "districts" USING btree ("old_id");--> statement-breakpoint
CREATE INDEX "district_old_regency_id_idx" ON "districts" USING btree ("old_regency_id");--> statement-breakpoint
CREATE INDEX "kbli_id_idx" ON "kblis" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_id_idx" ON "orders" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_company_id_idx" ON "orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "order_item_id_idx" ON "order_items" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_id_idx" ON "order_status_history" USING btree ("id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "otp_code_user_id_idx" ON "otp_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "otp_code_email_idx" ON "otp_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "parameter_category_id_idx" ON "parameter_categories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_category_cluster_id_idx" ON "parameter_categories" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "parameter_category_name_idx" ON "parameter_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parameter_tool_id_idx" ON "parameter_tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_tool_parameter_id_idx" ON "parameter_tools" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "parameter_tool_tool_id_idx" ON "parameter_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "parameter_id_idx" ON "parameters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "parameter_parameter_category_id_idx" ON "parameters" USING btree ("parameter_category_id");--> statement-breakpoint
CREATE INDEX "parameter_name_idx" ON "parameters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permission_name_resource_action_idx" ON "permissions" USING btree ("name","resource","action");--> statement-breakpoint
CREATE INDEX "province_name_idx" ON "provinces" USING btree ("name");--> statement-breakpoint
CREATE INDEX "province_old_id_idx" ON "provinces" USING btree ("old_id");--> statement-breakpoint
CREATE INDEX "regency_name_idx" ON "regencies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "regency_province_id_idx" ON "regencies" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "regency_old_id_idx" ON "regencies" USING btree ("old_id");--> statement-breakpoint
CREATE INDEX "regency_old_province_id_idx" ON "regencies" USING btree ("old_province_id");--> statement-breakpoint
CREATE INDEX "role_permission_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "testing_id_idx" ON "testing" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_testing_number_idx" ON "testing" USING btree ("testing_number");--> statement-breakpoint
CREATE INDEX "testing_testing_type_idx" ON "testing" USING btree ("testing_type");--> statement-breakpoint
CREATE INDEX "testing_user_id_idx" ON "testing" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "testing_company_id_idx" ON "testing" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "testing_item_id_idx" ON "testing_item" USING btree ("id");--> statement-breakpoint
CREATE INDEX "testing_item_testing_id_idx" ON "testing_item" USING btree ("testing_id");--> statement-breakpoint
CREATE INDEX "testing_item_parameter_id_idx" ON "testing_item" USING btree ("parameter_id");--> statement-breakpoint
CREATE INDEX "tool_id_idx" ON "tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_tool_code_idx" ON "tools" USING btree ("tool_code");--> statement-breakpoint
CREATE INDEX "user_company_id_idx" ON "user_companies" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_company_user_id_idx" ON "user_companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_company_testing_location_id_idx" ON "user_company_testing_locations" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_company_testing_location_user_company_id_idx" ON "user_company_testing_locations" USING btree ("user_company_id");--> statement-breakpoint
CREATE INDEX "user_permission_user_id_idx" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_permission_id_idx" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "user_role_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "email_deleted_at_unique_idx" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "village_name_idx" ON "villages" USING btree ("name");--> statement-breakpoint
CREATE INDEX "village_district_id_idx" ON "villages" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "village_old_id_idx" ON "villages" USING btree ("old_id");--> statement-breakpoint
CREATE INDEX "village_old_district_id_idx" ON "villages" USING btree ("old_district_id");