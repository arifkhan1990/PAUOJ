CREATE TABLE "assessment_participants" (
	"assessment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_participants_assessment_id_user_id_pk" PRIMARY KEY("assessment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_problems" (
	"assessment_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" text NOT NULL,
	CONSTRAINT "assessment_problems_assessment_id_problem_id_pk" PRIMARY KEY("assessment_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"access_code" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_problems" ADD CONSTRAINT "assessment_problems_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_problems" ADD CONSTRAINT "assessment_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_participants_user_idx" ON "assessment_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assessment_participants_expires_idx" ON "assessment_participants" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_problems_label_unique" ON "assessment_problems" USING btree ("assessment_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_problems_position_unique" ON "assessment_problems" USING btree ("assessment_id","position");--> statement-breakpoint
CREATE INDEX "assessment_problems_problem_idx" ON "assessment_problems" USING btree ("problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_slug_unique" ON "assessments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "assessments_start_idx" ON "assessments" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "assessments_end_idx" ON "assessments" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "assessments_published_idx" ON "assessments" USING btree ("is_published");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_assessment_created_idx" ON "submissions" USING btree ("assessment_id","created_at");