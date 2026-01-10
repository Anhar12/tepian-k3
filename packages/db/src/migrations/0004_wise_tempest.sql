CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'status_change');--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"metadata" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_type_id_idx" ON "audits" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_user_id_idx" ON "audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audits" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audits" USING btree ("created_at" desc);--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "audits" USING btree ("entity_type","entity_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "audits_changed_fields_idx" ON "audits" USING gin ("changed_fields");