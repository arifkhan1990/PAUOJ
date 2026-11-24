CREATE TYPE "public"."tshirt_size" AS ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');--> statement-breakpoint
CREATE TYPE "public"."user_current_status" AS ENUM('STUDENT', 'EMPLOYED', 'FREELANCER', 'JOB_SEEKER', 'OTHER');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_status" "user_current_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skills" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tshirt_size" "tshirt_size";