CREATE TABLE "study_list_item_notes" (
	"user_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_list_item_notes_user_id_list_id_problem_id_pk" PRIMARY KEY("user_id","list_id","problem_id")
);
--> statement-breakpoint
ALTER TABLE "study_list_item_notes" ADD CONSTRAINT "study_list_item_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_list_item_notes" ADD CONSTRAINT "study_list_item_notes_list_id_study_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."study_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_list_item_notes" ADD CONSTRAINT "study_list_item_notes_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_list_item_notes_list_idx" ON "study_list_item_notes" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "study_list_item_notes_user_idx" ON "study_list_item_notes" USING btree ("user_id");