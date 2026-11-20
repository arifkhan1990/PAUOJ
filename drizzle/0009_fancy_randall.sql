CREATE TABLE "problem_ratings" (
	"problem_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_ratings_problem_id_user_id_pk" PRIMARY KEY("problem_id","user_id"),
	CONSTRAINT "problem_ratings_value_check" CHECK ("problem_ratings"."value" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "problem_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"created_by_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_ratings" ADD CONSTRAINT "problem_ratings_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_ratings" ADD CONSTRAINT "problem_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_resources" ADD CONSTRAINT "problem_resources_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_resources" ADD CONSTRAINT "problem_resources_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_ratings_user_idx" ON "problem_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "problem_resources_problem_created_idx" ON "problem_resources" USING btree ("problem_id","created_at");