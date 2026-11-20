CREATE TABLE "study_list_items" (
	"list_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_list_items_list_id_problem_id_pk" PRIMARY KEY("list_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "study_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "companies" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "study_list_items" ADD CONSTRAINT "study_list_items_list_id_study_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."study_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_list_items" ADD CONSTRAINT "study_list_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_lists" ADD CONSTRAINT "study_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "study_list_items_position_unique" ON "study_list_items" USING btree ("list_id","position");--> statement-breakpoint
CREATE INDEX "study_list_items_problem_idx" ON "study_list_items" USING btree ("problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_lists_slug_unique" ON "study_lists" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "problems_category_idx" ON "problems" USING btree ("category","subcategory");--> statement-breakpoint
CREATE INDEX "problems_companies_idx" ON "problems" USING gin ("companies");