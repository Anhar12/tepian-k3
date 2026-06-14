ALTER TABLE "ppid_submissions" ALTER COLUMN "identity_file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ppid_submissions" ADD COLUMN "identity_files" jsonb DEFAULT '[]'::jsonb NOT NULL;