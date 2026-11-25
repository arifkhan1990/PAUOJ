CREATE TYPE "public"."social_report_kind" AS ENUM('MESSAGE', 'CONVERSATION', 'FOLLOW_REQUEST', 'PROFILE');--> statement-breakpoint
CREATE TYPE "public"."social_report_reason" AS ENUM('SPAM', 'HARASSMENT', 'HATE', 'SCAM', 'IMPERSONATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."social_report_status" AS ENUM('OPEN', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "conversation_mutes" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_mutes_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "social_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"kind" "social_report_kind" NOT NULL,
	"reason" "social_report_reason" NOT NULL,
	"details" text,
	"excerpt" text,
	"conversation_id" uuid,
	"message_id" uuid,
	"status" "social_report_status" DEFAULT 'OPEN' NOT NULL,
	"resolved_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_messages" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_follows" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "users" u SET "last_active_at" = GREATEST(
  u."created_at",
  COALESCE((SELECT max(s."created_at") FROM "sessions" s WHERE s."user_id" = u."id"), u."created_at"),
  COALESCE((SELECT max(sub."created_at") FROM "submissions" sub WHERE sub."user_id" = u."id"), u."created_at")
) WHERE u."last_active_at" IS NULL;--> statement-breakpoint
ALTER TABLE "conversation_mutes" ADD CONSTRAINT "conversation_mutes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_mutes" ADD CONSTRAINT "conversation_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_mutes_user_idx" ON "conversation_mutes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "social_reports_status_created_idx" ON "social_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "social_reports_target_idx" ON "social_reports" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE INDEX "social_reports_reporter_idx" ON "social_reports" USING btree ("reporter_id","created_at");--> statement-breakpoint
CREATE INDEX "social_reports_open_kind_idx" ON "social_reports" USING btree ("kind","created_at") WHERE "social_reports"."status" = 'OPEN';--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");