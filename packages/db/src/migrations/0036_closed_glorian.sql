ALTER TABLE "tool_checks" DROP CONSTRAINT "tool_checks_checked_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tool_checks" ADD CONSTRAINT "tool_checks_checked_by_employees_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;