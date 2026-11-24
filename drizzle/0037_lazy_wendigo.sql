CREATE TYPE "public"."contest_fee_status" AS ENUM('NOT_REQUIRED', 'PENDING', 'PAID', 'WAIVED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."contest_format" AS ENUM('SINGLE', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."contest_series_cadence" AS ENUM('MONTHLY_THIRD_SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."contest_team_status" AS ENUM('FORMING', 'REGISTERED', 'WITHDRAWN', 'DISQUALIFIED');--> statement-breakpoint
CREATE TYPE "public"."contest_candidate_status" AS ENUM('PROPOSED', 'SHORTLISTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."contest_host_request_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CONVERTED');--> statement-breakpoint
CREATE TYPE "public"."contest_integrity_event_type" AS ENUM('TAB_HIDDEN', 'PASTE', 'COPY', 'CONTEXT_MENU', 'PRINT', 'FULLSCREEN_EXIT', 'RAPID_SUBMIT');--> statement-breakpoint
CREATE TYPE "public"."contest_payment_status" AS ENUM('PENDING', 'PAID', 'WAIVED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."contest_sponsor_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."contest_sponsor_tier" AS ENUM('TITLE', 'GOLD', 'SILVER', 'COMMUNITY');--> statement-breakpoint
CREATE TYPE "public"."contest_staff_role" AS ENUM('DIRECTOR', 'SETTER', 'EDITORIAL', 'TESTER', 'OBSERVER');--> statement-breakpoint
CREATE TYPE "public"."contest_staff_status" AS ENUM('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED');--> statement-breakpoint
CREATE TABLE "contest_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"format" "contest_format" DEFAULT 'SINGLE' NOT NULL,
	"division" "contest_division" DEFAULT 'OPEN' NOT NULL,
	"cadence" "contest_series_cadence" DEFAULT 'MONTHLY_THIRD_SUNDAY' NOT NULL,
	"timezone" text DEFAULT 'Asia/Dhaka' NOT NULL,
	"week_of_month" integer DEFAULT 3 NOT NULL,
	"weekday" integer DEFAULT 0 NOT NULL,
	"hour" integer DEFAULT 10 NOT NULL,
	"minute" integer DEFAULT 0 NOT NULL,
	"duration_minutes" integer DEFAULT 90 NOT NULL,
	"team_size" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_team_members" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "contest_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"captain_id" uuid NOT NULL,
	"max_members" integer DEFAULT 3 NOT NULL,
	"status" "contest_team_status" DEFAULT 'FORMING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_teams_max_members_check" CHECK ("contest_teams"."max_members" between 2 and 6)
);
--> statement-breakpoint
CREATE TABLE "contest_host_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"format" "contest_format" DEFAULT 'SINGLE' NOT NULL,
	"division" "contest_division" DEFAULT 'OPEN' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"team_size" integer DEFAULT 3 NOT NULL,
	"expected_participants" integer DEFAULT 50 NOT NULL,
	"sponsor_note" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"fee_bdt" integer NOT NULL,
	"payment_status" "contest_payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_reference" text,
	"status" "contest_host_request_status" DEFAULT 'SUBMITTED' NOT NULL,
	"admin_note" text,
	"contest_id" uuid,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_host_requests_fee_check" CHECK ("contest_host_requests"."fee_bdt" between 3000 and 5000),
	CONSTRAINT "contest_host_requests_window_check" CHECK ("contest_host_requests"."end_at" > "contest_host_requests"."start_at")
);
--> statement-breakpoint
CREATE TABLE "contest_integrity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid,
	"type" "contest_integrity_event_type" NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_problem_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"proposed_by_id" uuid,
	"status" "contest_candidate_status" DEFAULT 'PROPOSED' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_problem_debuts" (
	"problem_id" uuid PRIMARY KEY NOT NULL,
	"contest_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tier" "contest_sponsor_tier" DEFAULT 'COMMUNITY' NOT NULL,
	"website_url" text,
	"logo_url" text,
	"message" text,
	"amount_bdt" integer,
	"status" "contest_sponsor_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by_id" uuid,
	"reviewed_by_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_sponsors_amount_check" CHECK ("contest_sponsors"."amount_bdt" is null or "contest_sponsors"."amount_bdt" >= 0)
);
--> statement-breakpoint
CREATE TABLE "contest_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "contest_staff_role" NOT NULL,
	"status" "contest_staff_status" DEFAULT 'INVITED' NOT NULL,
	"invited_by_id" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_staff_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"problem_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_registrations" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "format" "contest_format" DEFAULT 'SINGLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "team_size" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "is_official" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "auto_created" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "fee_status" "contest_fee_status" DEFAULT 'NOT_REQUIRED' NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "fee_bdt" integer;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "fee_reference" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "requires_fresh_problems" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "contests" SET "requires_fresh_problems" = false;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "eligibility" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "rules" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "prizes" text;--> statement-breakpoint
ALTER TABLE "contest_series" ADD CONSTRAINT "contest_series_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_team_members" ADD CONSTRAINT "contest_team_members_team_id_contest_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."contest_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_team_members" ADD CONSTRAINT "contest_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_teams" ADD CONSTRAINT "contest_teams_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_teams" ADD CONSTRAINT "contest_teams_captain_id_users_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_host_requests" ADD CONSTRAINT "contest_host_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_host_requests" ADD CONSTRAINT "contest_host_requests_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_host_requests" ADD CONSTRAINT "contest_host_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_integrity_events" ADD CONSTRAINT "contest_integrity_events_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_integrity_events" ADD CONSTRAINT "contest_integrity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_integrity_events" ADD CONSTRAINT "contest_integrity_events_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_candidates" ADD CONSTRAINT "contest_problem_candidates_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_candidates" ADD CONSTRAINT "contest_problem_candidates_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_candidates" ADD CONSTRAINT "contest_problem_candidates_proposed_by_id_users_id_fk" FOREIGN KEY ("proposed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_debuts" ADD CONSTRAINT "contest_problem_debuts_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problem_debuts" ADD CONSTRAINT "contest_problem_debuts_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sponsors" ADD CONSTRAINT "contest_sponsors_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sponsors" ADD CONSTRAINT "contest_sponsors_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sponsors" ADD CONSTRAINT "contest_sponsors_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff" ADD CONSTRAINT "contest_staff_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff" ADD CONSTRAINT "contest_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff" ADD CONSTRAINT "contest_staff_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff_notes" ADD CONSTRAINT "contest_staff_notes_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff_notes" ADD CONSTRAINT "contest_staff_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_staff_notes" ADD CONSTRAINT "contest_staff_notes_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_series_key_unique" ON "contest_series" USING btree ("key");--> statement-breakpoint
CREATE INDEX "contest_series_active_idx" ON "contest_series" USING btree ("is_active","next_run_at");--> statement-breakpoint
CREATE INDEX "contest_team_members_user_idx" ON "contest_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_teams_name_unique" ON "contest_teams" USING btree ("contest_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_teams_invite_unique" ON "contest_teams" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "contest_teams_contest_idx" ON "contest_teams" USING btree ("contest_id");--> statement-breakpoint
CREATE INDEX "contest_teams_captain_idx" ON "contest_teams" USING btree ("captain_id");--> statement-breakpoint
CREATE INDEX "contest_host_requests_status_created_idx" ON "contest_host_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contest_host_requests_user_idx" ON "contest_host_requests" USING btree ("requested_by_id","created_at");--> statement-breakpoint
CREATE INDEX "contest_integrity_events_contest_created_idx" ON "contest_integrity_events" USING btree ("contest_id","created_at");--> statement-breakpoint
CREATE INDEX "contest_integrity_events_user_created_idx" ON "contest_integrity_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "contest_integrity_events_type_idx" ON "contest_integrity_events" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_candidates_contest_problem_unique" ON "contest_problem_candidates" USING btree ("contest_id","problem_id");--> statement-breakpoint
CREATE INDEX "contest_candidates_contest_status_idx" ON "contest_problem_candidates" USING btree ("contest_id","status");--> statement-breakpoint
CREATE INDEX "contest_problem_debuts_contest_idx" ON "contest_problem_debuts" USING btree ("contest_id");--> statement-breakpoint
CREATE INDEX "contest_sponsors_contest_status_idx" ON "contest_sponsors" USING btree ("contest_id","status");--> statement-breakpoint
CREATE INDEX "contest_sponsors_status_created_idx" ON "contest_sponsors" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_staff_contest_user_unique" ON "contest_staff" USING btree ("contest_id","user_id");--> statement-breakpoint
CREATE INDEX "contest_staff_user_idx" ON "contest_staff" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "contest_staff_contest_role_idx" ON "contest_staff" USING btree ("contest_id","role");--> statement-breakpoint
CREATE INDEX "contest_staff_notes_contest_created_idx" ON "contest_staff_notes" USING btree ("contest_id","created_at");--> statement-breakpoint
CREATE INDEX "contest_staff_notes_author_idx" ON "contest_staff_notes" USING btree ("author_id");--> statement-breakpoint
ALTER TABLE "contest_registrations" ADD CONSTRAINT "contest_registrations_team_id_contest_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."contest_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_series_id_contest_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."contest_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contest_registrations_team_idx" ON "contest_registrations" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contests_series_occurrence_unique" ON "contests" USING btree ("series_id","start_at");--> statement-breakpoint
CREATE INDEX "contests_format_start_idx" ON "contests" USING btree ("format","start_at");--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_team_size_check" CHECK ("contests"."team_size" between 2 and 6);--> statement-breakpoint
ALTER TABLE "contest_team_members" ADD CONSTRAINT "contest_team_members_role_check" CHECK ("contest_team_members"."role" in ('CAPTAIN', 'MEMBER'));--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_fee_bdt_check" CHECK ("contests"."fee_bdt" is null or "contests"."fee_bdt" between 3000 and 5000);