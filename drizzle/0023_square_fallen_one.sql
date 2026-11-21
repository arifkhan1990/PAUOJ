CREATE TYPE "public"."assessment_claim_assurance" AS ENUM('VERIFIED_EMAIL', 'EMAIL_MATCH', 'REF_MATCH');--> statement-breakpoint
CREATE TYPE "public"."assessment_invite_status" AS ENUM('UNSENT', 'SENT', 'OPENED', 'CLAIMED', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."assessment_join_mode" AS ENUM('OPEN_CODE', 'INVITE');--> statement-breakpoint
CREATE TABLE "assessment_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"candidate_ref" text NOT NULL,
	"email" text,
	"group_label" text,
	"candidate_name" text,
	"token_hash" text NOT NULL,
	"status" "assessment_invite_status" DEFAULT 'UNSENT' NOT NULL,
	"sent_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"send_count" integer DEFAULT 0 NOT NULL,
	"send_window_started_at" timestamp with time zone,
	"send_window_count" integer DEFAULT 0 NOT NULL,
	"send_lock_at" timestamp with time zone,
	"failed_claim_count" integer DEFAULT 0 NOT NULL,
	"last_failed_claim_at" timestamp with time zone,
	"claim_fail_window_started_at" timestamp with time zone,
	"claim_fail_window_count" integer DEFAULT 0 NOT NULL,
	"claimed_by_user_id" uuid,
	"claimed_at" timestamp with time zone,
	"claimed_assurance" "assessment_claim_assurance",
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_participants" ADD COLUMN "invite_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_participants" ADD COLUMN "assurance" "assessment_claim_assurance";--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "join_mode" "assessment_join_mode" DEFAULT 'OPEN_CODE' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_invites" ADD CONSTRAINT "assessment_invites_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invites" ADD CONSTRAINT "assessment_invites_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invites" ADD CONSTRAINT "assessment_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_invites_token_hash_unique" ON "assessment_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_invites_assessment_ref_unique" ON "assessment_invites" USING btree ("assessment_id",upper(btrim("candidate_ref")));--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_invites_assessment_email_unique" ON "assessment_invites" USING btree ("assessment_id",lower("email")) WHERE "assessment_invites"."email" is not null;--> statement-breakpoint
CREATE INDEX "assessment_invites_assessment_status_idx" ON "assessment_invites" USING btree ("assessment_id","status");--> statement-breakpoint
CREATE INDEX "assessment_invites_assessment_group_idx" ON "assessment_invites" USING btree ("assessment_id","group_label");--> statement-breakpoint
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_invite_id_assessment_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."assessment_invites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_participants_invite_unique" ON "assessment_participants" USING btree ("invite_id") WHERE "assessment_participants"."invite_id" is not null;