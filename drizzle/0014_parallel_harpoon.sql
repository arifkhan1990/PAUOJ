CREATE TYPE "public"."contest_division" AS ENUM('OPEN', 'DIV1', 'DIV2', 'DIV3', 'DIV4');--> statement-breakpoint
CREATE TABLE "virtual_contests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "division" "contest_division" DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "virtual_contest_id" uuid;--> statement-breakpoint
ALTER TABLE "virtual_contests" ADD CONSTRAINT "virtual_contests_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_contests" ADD CONSTRAINT "virtual_contests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "virtual_contests_contest_user_unique" ON "virtual_contests" USING btree ("contest_id","user_id");--> statement-breakpoint
CREATE INDEX "virtual_contests_user_idx" ON "virtual_contests" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_virtual_contest_id_virtual_contests_id_fk" FOREIGN KEY ("virtual_contest_id") REFERENCES "public"."virtual_contests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_virtual_created_idx" ON "submissions" USING btree ("virtual_contest_id","created_at");