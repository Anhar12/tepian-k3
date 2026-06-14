CREATE TYPE "public"."ppid_document_category" AS ENUM('setiap-saat', 'berkala', 'serta-merta', 'dikecualikan');--> statement-breakpoint
CREATE TYPE "public"."ppid_submission_status" AS ENUM('pending', 'disetujui', 'ditolak', 'selesai');--> statement-breakpoint
CREATE TABLE "ppid_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"document_number" varchar(100),
	"description" text,
	"category" "ppid_document_category" NOT NULL,
	"type" varchar(100) NOT NULL,
	"publisher" varchar(255) NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" integer,
	"published_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ppid_submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ticket_number" varchar(100) NOT NULL,
	"nama_pemohon" varchar(250) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(250) NOT NULL,
	"address" text NOT NULL,
	"jenis_informasi" text NOT NULL,
	"rincian_informasi" text NOT NULL,
	"tujuan_penggunaan" text NOT NULL,
	"cara_mendapatkan" varchar(100) NOT NULL,
	"identity_file_url" text NOT NULL,
	"identity_file_name" varchar(255),
	"identity_file_size" integer,
	"status" "ppid_submission_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"response_file_url" text,
	"response_file_name" varchar(255),
	"response_file_size" integer,
	"user_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ppid_submissions" ADD CONSTRAINT "ppid_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ppid_doc_category_idx" ON "ppid_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ppid_doc_title_idx" ON "ppid_documents" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "ppid_sub_ticket_idx" ON "ppid_submissions" USING btree ("ticket_number") WHERE "ppid_submissions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ppid_sub_email_idx" ON "ppid_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ppid_sub_status_idx" ON "ppid_submissions" USING btree ("status");