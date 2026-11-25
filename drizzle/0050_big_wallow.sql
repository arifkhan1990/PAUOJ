CREATE TABLE "message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"mime" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_attachments_message_id_unique" UNIQUE("message_id"),
	CONSTRAINT "message_attachments_mime_check" CHECK ("message_attachments"."mime" in ('image/png', 'image/jpeg', 'image/webp')),
	CONSTRAINT "message_attachments_dimensions_check" CHECK ("message_attachments"."width" between 1 and 4096 and "message_attachments"."height" between 1 and 4096),
	CONSTRAINT "message_attachments_size_check" CHECK (octet_length("message_attachments"."bytes") between 1 and 5242880)
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_body_check";--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_body_check" CHECK (char_length("messages"."body") between 0 and 2000);