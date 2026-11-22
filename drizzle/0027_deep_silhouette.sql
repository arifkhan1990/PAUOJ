CREATE TABLE "lesson_comment_votes" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_comment_votes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id"),
	CONSTRAINT "lesson_comment_votes_value_check" CHECK ("lesson_comment_votes"."value" in (-1, 1))
);
--> statement-breakpoint
CREATE TABLE "lesson_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_slug" text NOT NULL,
	"topic_slug" text NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_reactions" (
	"module_slug" text NOT NULL,
	"topic_slug" text NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_reactions_module_slug_topic_slug_user_id_pk" PRIMARY KEY("module_slug","topic_slug","user_id"),
	CONSTRAINT "lesson_reactions_value_check" CHECK ("lesson_reactions"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "lesson_comment_votes" ADD CONSTRAINT "lesson_comment_votes_comment_id_lesson_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."lesson_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_comment_votes" ADD CONSTRAINT "lesson_comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_comments" ADD CONSTRAINT "lesson_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_comments" ADD CONSTRAINT "lesson_comments_parent_id_lesson_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lesson_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_reactions" ADD CONSTRAINT "lesson_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_comment_votes_user_idx" ON "lesson_comment_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_comments_topic_created_idx" ON "lesson_comments" USING btree ("module_slug","topic_slug","created_at");--> statement-breakpoint
CREATE INDEX "lesson_comments_parent_idx" ON "lesson_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "lesson_comments_user_idx" ON "lesson_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_reactions_topic_idx" ON "lesson_reactions" USING btree ("module_slug","topic_slug");