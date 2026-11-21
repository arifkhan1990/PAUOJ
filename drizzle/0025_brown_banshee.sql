CREATE TYPE "public"."problem_publication_status" AS ENUM('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."problem_review_approval_status" AS ENUM('ACTIVE', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."problem_review_hold_status" AS ENUM('OPEN', 'ADDRESSED', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "problem_review_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"cycle" integer NOT NULL,
	"status" "problem_review_approval_status" DEFAULT 'ACTIVE' NOT NULL,
	"note" text,
	"solution_language" text NOT NULL,
	"solution_source" text NOT NULL,
	"tests_added" integer DEFAULT 0 NOT NULL,
	"editorial_provided" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_review_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"cycle" integer NOT NULL,
	"status" "problem_review_hold_status" DEFAULT 'OPEN' NOT NULL,
	"note" text NOT NULL,
	"author_response" text,
	"responded_at" timestamp with time zone,
	"resolution_note" text,
	"resolved_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"reopen_note" text,
	"reopened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "is_public" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "publication_status" "problem_publication_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "review_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "problems" SET "publication_status" = (CASE WHEN "is_public" THEN 'PUBLISHED' ELSE 'DRAFT' END)::"problem_publication_status", "published_at" = CASE WHEN "is_public" THEN "created_at" ELSE NULL END;--> statement-breakpoint
ALTER TABLE "problem_review_approvals" ADD CONSTRAINT "problem_review_approvals_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_review_approvals" ADD CONSTRAINT "problem_review_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_review_holds" ADD CONSTRAINT "problem_review_holds_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_review_holds" ADD CONSTRAINT "problem_review_holds_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_review_holds" ADD CONSTRAINT "problem_review_holds_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_review_approvals_unique" ON "problem_review_approvals" USING btree ("problem_id","reviewer_id","cycle");--> statement-breakpoint
CREATE INDEX "problem_review_approvals_problem_idx" ON "problem_review_approvals" USING btree ("problem_id","cycle","status");--> statement-breakpoint
CREATE INDEX "problem_review_approvals_reviewer_idx" ON "problem_review_approvals" USING btree ("reviewer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_review_holds_active_unique" ON "problem_review_holds" USING btree ("problem_id","reviewer_id") WHERE "problem_review_holds"."status" in ('OPEN', 'ADDRESSED');--> statement-breakpoint
CREATE INDEX "problem_review_holds_problem_idx" ON "problem_review_holds" USING btree ("problem_id","status","created_at");--> statement-breakpoint
CREATE INDEX "problem_review_holds_reviewer_idx" ON "problem_review_holds" USING btree ("reviewer_id","created_at");--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_publication_public_check" CHECK ("is_public" = ("publication_status" = 'PUBLISHED'));