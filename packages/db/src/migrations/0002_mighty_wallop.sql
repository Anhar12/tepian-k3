ALTER TABLE "user_companies" ADD COLUMN "company_picture_file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_companies" ADD COLUMN "company_picture_url" text NOT NULL;--> statement-breakpoint
CREATE INDEX "user_company_id_idx" ON "user_companies" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_company_user_id_idx" ON "user_companies" USING btree ("user_id");