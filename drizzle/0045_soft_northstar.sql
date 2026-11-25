CREATE TABLE "user_avatar_images" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_avatar_images_mime_check" CHECK ("user_avatar_images"."mime" in ('image/png', 'image/jpeg', 'image/webp')),
	CONSTRAINT "user_avatar_images_size_check" CHECK (octet_length("user_avatar_images"."bytes") between 1 and 1048576),
	CONSTRAINT "user_avatar_images_dimensions_check" CHECK ("user_avatar_images"."width" between 1 and 2048 and "user_avatar_images"."height" between 1 and 2048)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_preset" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_image_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_avatar_images" ADD CONSTRAINT "user_avatar_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;