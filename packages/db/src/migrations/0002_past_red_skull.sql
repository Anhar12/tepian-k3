CREATE TYPE "public"."tools_availability" AS ENUM('Ready', 'Kalibrasi', 'Not Ready', 'Maintenance', 'Dipinjam');--> statement-breakpoint
CREATE TYPE "public"."tools_condition" AS ENUM('Baik', 'Rusak', 'Diperingatkan', 'Tidak Menyala');--> statement-breakpoint
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
CREATE INDEX "tool_id_idx" ON "tools" USING btree ("id");--> statement-breakpoint
CREATE INDEX "tool_tool_code_idx" ON "tools" USING btree ("tool_code");