CREATE TABLE "user_follows" (
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id"),
	CONSTRAINT "user_follows_no_self_check" CHECK ("user_follows"."follower_id" <> "user_follows"."following_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_follows_following_created_idx" ON "user_follows" USING btree ("following_id","created_at");--> statement-breakpoint
CREATE INDEX "user_follows_follower_created_idx" ON "user_follows" USING btree ("follower_id","created_at");--> statement-breakpoint
