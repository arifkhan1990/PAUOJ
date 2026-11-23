CREATE TABLE "lesson_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_slug" text NOT NULL,
	"source" text NOT NULL,
	"order_id" uuid,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_entitlements_source_check" CHECK ("lesson_entitlements"."source" in ('PURCHASE', 'SCHOLARSHIP'))
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'PURCHASE' NOT NULL,
	"product" text NOT NULL,
	"module_slug" text,
	"amount_bdt" integer NOT NULL,
	"trx_id" text,
	"sender_number" text,
	"user_note" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_kind_check" CHECK ("payment_orders"."kind" in ('PURCHASE', 'FREE_REQUEST')),
	CONSTRAINT "payment_orders_product_check" CHECK ("payment_orders"."product" in ('MODULE', 'BUNDLE')),
	CONSTRAINT "payment_orders_status_check" CHECK ("payment_orders"."status" in ('PENDING', 'APPROVED', 'REJECTED')),
	CONSTRAINT "payment_orders_amount_check" CHECK ("payment_orders"."amount_bdt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "lesson_entitlements" ADD CONSTRAINT "lesson_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_entitlements" ADD CONSTRAINT "lesson_entitlements_order_id_payment_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_entitlements" ADD CONSTRAINT "lesson_entitlements_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_entitlements_user_module_unique" ON "lesson_entitlements" USING btree ("user_id","module_slug");--> statement-breakpoint
CREATE INDEX "lesson_entitlements_user_idx" ON "lesson_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_trx_id_unique" ON "payment_orders" USING btree ("trx_id");--> statement-breakpoint
CREATE INDEX "payment_orders_status_created_idx" ON "payment_orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "payment_orders_user_idx" ON "payment_orders" USING btree ("user_id","created_at");