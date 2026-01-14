CREATE TYPE "public"."employee_status" AS ENUM('siap', 'spt', 'standby', 'cuti');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(250) NOT NULL,
	"email" varchar(250) NOT NULL,
	"position" varchar(250) NOT NULL,
	"status" "employee_status" DEFAULT 'siap' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_id_idx" ON "employees" USING btree ("id");--> statement-breakpoint
CREATE INDEX "employee_user_id_idx" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "employee_email_idx" ON "employees" USING btree ("email");