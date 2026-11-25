CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"source_key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"created_by" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_account" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_learning" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_achievements" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_announcements" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_marketing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_discussions" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_messages" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_marketing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "broadcasts_source_key_unique" ON "broadcasts" USING btree ("source_key");--> statement-breakpoint
CREATE INDEX "broadcasts_created_idx" ON "broadcasts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "broadcasts_pending_idx" ON "broadcasts" USING btree ("created_at") WHERE "broadcasts"."completed_at" is null;--> statement-breakpoint
INSERT INTO "broadcasts" ("kind", "source_key", "title", "body", "href", "completed_at")
SELECT
	'MARKETING',
	'contest:' || "id",
	'New contest: ' || "title",
	'Registration is open. Open the contest page for the schedule, format and problem set.',
	'/contests/' || "slug",
	now()
FROM "contests"
WHERE "is_public" = true
ON CONFLICT ("source_key") DO NOTHING;--> statement-breakpoint
INSERT INTO "broadcasts" ("kind", "source_key", "title", "body", "href", "completed_at")
VALUES
	('MARKETING', 'module:basic-programming-math', 'New course module: Basic Programming & Math', 'Start from zero: input/output, loops, functions and the math every judge problem needs.', '/learn/basic-programming-math', now()),
	('MARKETING', 'module:basic-data-structures', 'New course module: Basic Data Structures', 'Arrays, stacks, queues, linked lists, hashing and the patterns built on them.', '/learn/basic-data-structures', now()),
	('MARKETING', 'module:basic-intermediate-algorithms', 'New course module: Basic & Intermediate Algorithms', 'Sorting, searching, recursion, greedy thinking and the core algorithm toolkit.', '/learn/basic-intermediate-algorithms', now()),
	('MARKETING', 'module:trees-graphs', 'New course module: Trees & Graphs', 'Traversals, shortest paths, spanning trees and graph modelling for real problems.', '/learn/trees-graphs', now()),
	('MARKETING', 'module:dynamic-programming', 'New course module: Dynamic Programming', 'States, transitions, memoisation and the DP patterns that show up in contests.', '/learn/dynamic-programming', now()),
	('MARKETING', 'module:advanced-data-structures', 'New course module: Advanced Data Structures', 'Segment trees, Fenwick trees, DSU, tries and heavy-light decomposition.', '/learn/advanced-data-structures', now()),
	('MARKETING', 'module:advanced-algorithms', 'New course module: Advanced Algorithms', 'Flows, string algorithms, number theory and advanced contest techniques.', '/learn/advanced-algorithms', now()),
	('MARKETING', 'module:basic-sql', 'New course module: Basic SQL · ShopSphere', 'Query a realistic marketplace database from SELECT to joins and missing rows.', '/learn/basic-sql', now()),
	('MARKETING', 'module:advanced-sql', 'New course module: Advanced SQL · ShopSphere', 'Windows, hierarchies, funnels and business metrics on the ShopSphere project.', '/learn/advanced-sql', now()),
	('MARKETING', 'module:git-github', 'New course module: Git & GitHub', 'Snapshots, branches and collaboration with hands-on terminal labs. Free.', '/learn/git-github', now()),
	('MARKETING', 'module:docker-cicd', 'New course module: Docker & CI/CD', 'Containers, Compose and production pipelines with hands-on labs. Free.', '/learn/docker-cicd', now())
ON CONFLICT ("source_key") DO NOTHING;
