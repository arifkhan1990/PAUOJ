CREATE TYPE "public"."contest_team_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "contest_team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"status" "contest_team_invite_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "contest_host_requests" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "contest_team_invites" ADD CONSTRAINT "contest_team_invites_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_team_invites" ADD CONSTRAINT "contest_team_invites_team_id_contest_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."contest_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_team_invites" ADD CONSTRAINT "contest_team_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_team_invites" ADD CONSTRAINT "contest_team_invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_team_invites_team_user_unique" ON "contest_team_invites" USING btree ("team_id","invited_user_id");--> statement-breakpoint
CREATE INDEX "contest_team_invites_user_status_idx" ON "contest_team_invites" USING btree ("invited_user_id","status");--> statement-breakpoint
CREATE INDEX "contest_team_invites_contest_status_idx" ON "contest_team_invites" USING btree ("contest_id","status");