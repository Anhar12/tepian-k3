CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused', 'sick');--> statement-breakpoint
CREATE TABLE "pelatihan_attendances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pelatihan_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pelatihan_id" uuid NOT NULL,
	"title" varchar(250) NOT NULL,
	"description" text,
	"session_date" timestamp with time zone NOT NULL,
	"start_time" varchar(50) NOT NULL,
	"end_time" varchar(50) NOT NULL,
	"room" varchar(250),
	"category" varchar(100),
	"material_url" varchar(500),
	"meet_url" varchar(500),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pelatihan_attendances" ADD CONSTRAINT "pelatihan_attendances_enrollment_id_pelatihan_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."pelatihan_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_attendances" ADD CONSTRAINT "pelatihan_attendances_schedule_id_pelatihan_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."pelatihan_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelatihan_schedules" ADD CONSTRAINT "pelatihan_schedules_pelatihan_id_pelatihan_id_fk" FOREIGN KEY ("pelatihan_id") REFERENCES "public"."pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_enrollment_schedule_idx" ON "pelatihan_attendances" USING btree ("enrollment_id","schedule_id") WHERE "pelatihan_attendances"."deleted_at" IS NULL;