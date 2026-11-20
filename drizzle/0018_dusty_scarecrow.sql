CREATE TYPE "public"."contest_problem_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "contest_problem_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"author_id" uuid,
	"requested_by_id" uuid,
	"status" "contest_problem_approval_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_problem_approvals" ADD CONSTRAINT "contest_problem_approvals_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_approvals" ADD CONSTRAINT "contest_problem_approvals_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_approvals" ADD CONSTRAINT "contest_problem_approvals_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_approvals" ADD CONSTRAINT "contest_problem_approvals_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_approvals" ADD CONSTRAINT "contest_problem_approvals_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_problem_approvals_contest_problem_unique" ON "contest_problem_approvals" USING btree ("contest_id","problem_id");--> statement-breakpoint
CREATE INDEX "contest_problem_approvals_author_status_idx" ON "contest_problem_approvals" USING btree ("author_id","status","created_at");--> statement-breakpoint
CREATE INDEX "contest_problem_approvals_contest_status_idx" ON "contest_problem_approvals" USING btree ("contest_id","status");--> statement-breakpoint
INSERT INTO "contest_problem_approvals" ("contest_id", "problem_id", "author_id", "requested_by_id", "status", "reviewed_at")
SELECT cp."contest_id", cp."problem_id", p."author_id", c."created_by", 'APPROVED', now()
FROM "contest_problems" cp
JOIN "problems" p ON p."id" = cp."problem_id"
JOIN "contests" c ON c."id" = cp."contest_id"
ON CONFLICT DO NOTHING;