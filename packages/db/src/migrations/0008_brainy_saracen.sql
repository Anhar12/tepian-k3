CREATE TABLE "survey_feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"feedback" text,
	"submitted_at" timestamp with time zone NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "survey_feedback_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"rating" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "survey_feedback" ADD CONSTRAINT "survey_feedback_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_feedback" ADD CONSTRAINT "survey_feedback_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_feedback_id_idx" ON "survey_feedback" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_feedback_order_id_idx" ON "survey_feedback" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "survey_question_id_idx" ON "survey_questions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_question_order_idx" ON "survey_questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "survey_question_is_active_idx" ON "survey_questions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "survey_response_id_idx" ON "survey_responses" USING btree ("id");--> statement-breakpoint
CREATE INDEX "survey_response_order_id_idx" ON "survey_responses" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "survey_response_question_id_idx" ON "survey_responses" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_order_question_unique_idx" ON "survey_responses" USING btree ("order_id","question_id");