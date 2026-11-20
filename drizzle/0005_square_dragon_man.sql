CREATE TABLE "contest_clarifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"problem_id" uuid,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"answered_by_id" uuid,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_clarifications" ADD CONSTRAINT "contest_clarifications_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_clarifications" ADD CONSTRAINT "contest_clarifications_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_clarifications" ADD CONSTRAINT "contest_clarifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_clarifications" ADD CONSTRAINT "contest_clarifications_answered_by_id_users_id_fk" FOREIGN KEY ("answered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contest_clarifications_contest_created_idx" ON "contest_clarifications" USING btree ("contest_id","created_at");--> statement-breakpoint
CREATE INDEX "contest_clarifications_problem_idx" ON "contest_clarifications" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "contest_clarifications_user_idx" ON "contest_clarifications" USING btree ("user_id");