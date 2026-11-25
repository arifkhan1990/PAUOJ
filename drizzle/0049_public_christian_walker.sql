ALTER TABLE "broadcasts" ADD COLUMN "baseline" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "broadcasts" SET "baseline" = true;
