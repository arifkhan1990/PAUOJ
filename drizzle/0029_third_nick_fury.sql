ALTER TABLE "lesson_comment_reports" ADD COLUMN "status" text DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD COLUMN "resolved_by" uuid;--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD CONSTRAINT "lesson_comment_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_comment_reports_status_created_idx" ON "lesson_comment_reports" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "lesson_comment_reports" ADD CONSTRAINT "lesson_comment_reports_status_check" CHECK ("lesson_comment_reports"."status" in ('OPEN', 'RESOLVED'));