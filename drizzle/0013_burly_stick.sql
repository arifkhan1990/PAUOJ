CREATE TYPE "public"."problem_checker" AS ENUM('EXACT', 'TOKEN', 'FLOAT', 'CUSTOM');--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "checker_type" "problem_checker" DEFAULT 'EXACT' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "checker_source" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "float_tolerance" real DEFAULT 0.000001 NOT NULL;