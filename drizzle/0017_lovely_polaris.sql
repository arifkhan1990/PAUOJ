CREATE TYPE "public"."problem_contribution_kind" AS ENUM('STATEMENT', 'TESTS', 'EDITORIAL');--> statement-breakpoint
CREATE TYPE "public"."problem_contribution_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "problem_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"contributor_id" uuid NOT NULL,
	"kind" "problem_contribution_kind" NOT NULL,
	"payload" jsonb NOT NULL,
	"note" text,
	"status" "problem_contribution_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_contributions" ADD CONSTRAINT "problem_contributions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_contributions" ADD CONSTRAINT "problem_contributions_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_contributions" ADD CONSTRAINT "problem_contributions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_contributions_pending_unique" ON "problem_contributions" USING btree ("problem_id","contributor_id","kind") WHERE "problem_contributions"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "problem_contributions_problem_status_created_idx" ON "problem_contributions" USING btree ("problem_id","status","created_at");--> statement-breakpoint
CREATE INDEX "problem_contributions_contributor_created_idx" ON "problem_contributions" USING btree ("contributor_id","created_at");