CREATE TABLE "document_signatures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"signed_by_user_id" uuid NOT NULL,
	"signer_name" varchar(255) NOT NULL,
	"signer_email" varchar(255),
	"purpose" text NOT NULL,
	"signature_order" integer,
	"qr_code_position" jsonb NOT NULL,
	"verification_token" varchar(255) NOT NULL,
	"verification_url" text NOT NULL,
	"signature_data" text NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "document_signatures_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_signatures_document_id_idx" ON "document_signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_signatures_signed_by_idx" ON "document_signatures" USING btree ("signed_by_user_id");--> statement-breakpoint
CREATE INDEX "document_signatures_verification_token_idx" ON "document_signatures" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "document_signatures_created_at_idx" ON "document_signatures" USING btree ("created_at");