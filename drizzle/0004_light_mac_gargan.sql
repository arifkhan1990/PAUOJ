CREATE TABLE "problem_comment_votes" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_comment_votes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id"),
	CONSTRAINT "problem_comment_votes_value_check" CHECK ("problem_comment_votes"."value" in (-1, 1))
);
--> statement-breakpoint
CREATE TABLE "problem_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_comment_votes" ADD CONSTRAINT "problem_comment_votes_comment_id_problem_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."problem_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_comment_votes" ADD CONSTRAINT "problem_comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_comments" ADD CONSTRAINT "problem_comments_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_comments" ADD CONSTRAINT "problem_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_comments" ADD CONSTRAINT "problem_comments_parent_id_problem_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."problem_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_comment_votes_user_idx" ON "problem_comment_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "problem_comments_problem_created_idx" ON "problem_comments" USING btree ("problem_id","created_at");--> statement-breakpoint
CREATE INDEX "problem_comments_parent_idx" ON "problem_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "problem_comments_user_idx" ON "problem_comments" USING btree ("user_id");