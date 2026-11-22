CREATE TABLE "lesson_comment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD CONSTRAINT "lesson_comment_reports_comment_id_lesson_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."lesson_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD CONSTRAINT "lesson_comment_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_comment_reports_comment_reporter_unique" ON "lesson_comment_reports" USING btree ("comment_id","reporter_id");--> statement-breakpoint
CREATE INDEX "lesson_comment_reports_comment_idx" ON "lesson_comment_reports" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "lesson_comment_reports_reporter_idx" ON "lesson_comment_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "lesson_comments_topic_parent_created_idx" ON "lesson_comments" USING btree ("module_slug","topic_slug","parent_id","created_at");