CREATE TABLE "study_list_enrollments" (
	"user_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_list_enrollments_user_id_list_id_pk" PRIMARY KEY("user_id","list_id")
);
--> statement-breakpoint
CREATE TABLE "study_list_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_list_items" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "study_lists" ADD COLUMN "level" text DEFAULT 'BEGINNER' NOT NULL;--> statement-breakpoint
ALTER TABLE "study_lists" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
ALTER TABLE "study_lists" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "study_list_enrollments" ADD CONSTRAINT "study_list_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_list_enrollments" ADD CONSTRAINT "study_list_enrollments_list_id_study_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."study_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_list_sections" ADD CONSTRAINT "study_list_sections_list_id_study_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."study_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_list_enrollments_list_idx" ON "study_list_enrollments" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_list_sections_position_unique" ON "study_list_sections" USING btree ("list_id","position");--> statement-breakpoint
CREATE INDEX "study_list_sections_list_idx" ON "study_list_sections" USING btree ("list_id");--> statement-breakpoint
ALTER TABLE "study_list_items" ADD CONSTRAINT "study_list_items_section_id_study_list_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."study_list_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_list_items_section_idx" ON "study_list_items" USING btree ("section_id");--> statement-breakpoint
ALTER TABLE "study_lists" ADD CONSTRAINT "study_lists_level_check" CHECK ("study_lists"."level" in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'));--> statement-breakpoint
ALTER TABLE "study_lists" ADD CONSTRAINT "study_lists_estimated_minutes_check" CHECK ("study_lists"."estimated_minutes" is null or "study_lists"."estimated_minutes" > 0);