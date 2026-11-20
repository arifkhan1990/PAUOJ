CREATE TABLE "contest_rating_changes" (
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"old_rating" integer NOT NULL,
	"new_rating" integer NOT NULL,
	"delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_rating_changes_contest_id_user_id_pk" PRIMARY KEY("contest_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "rated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contest_rating_changes" ADD CONSTRAINT "contest_rating_changes_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_rating_changes" ADD CONSTRAINT "contest_rating_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contest_rating_changes_user_created_idx" ON "contest_rating_changes" USING btree ("user_id","created_at");