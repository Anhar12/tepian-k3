CREATE INDEX "role_permission_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "user_permission_user_id_idx" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_permission_id_idx" ON "user_permissions" USING btree ("permission_id");