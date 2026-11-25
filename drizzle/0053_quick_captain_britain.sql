CREATE TABLE "problem_reference_solutions" (
	"problem_id" uuid PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_reference_solutions" ADD CONSTRAINT "problem_reference_solutions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;