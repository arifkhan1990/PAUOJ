CREATE TABLE "learning_checkpoint_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_slug" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_checkpoint_attempts" ADD CONSTRAINT "learning_checkpoint_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_checkpoint_attempts_user_module_unique" ON "learning_checkpoint_attempts" USING btree ("user_id","module_slug");--> statement-breakpoint
CREATE INDEX "learning_checkpoint_attempts_user_idx" ON "learning_checkpoint_attempts" USING btree ("user_id");