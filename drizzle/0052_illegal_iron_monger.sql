ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_mime_check";--> statement-breakpoint
ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_dimensions_check";--> statement-breakpoint
ALTER TABLE "message_attachments" ALTER COLUMN "width" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_attachments" ALTER COLUMN "height" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD COLUMN "kind" text DEFAULT 'IMAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD COLUMN "size_bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_kind_check" CHECK ("message_attachments"."kind" in ('IMAGE', 'DOCUMENT'));--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_image_check" CHECK ("message_attachments"."kind" <> 'IMAGE' or (
        "message_attachments"."mime" in ('image/png', 'image/jpeg', 'image/webp')
        and "message_attachments"."width" is not null
        and "message_attachments"."width" between 1 and 4096
        and "message_attachments"."height" is not null
        and "message_attachments"."height" between 1 and 4096
        and "message_attachments"."file_name" is null
        and "message_attachments"."size_bytes" = 0
      ));--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_document_check" CHECK ("message_attachments"."kind" <> 'DOCUMENT' or (
        "message_attachments"."mime" in (
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/zip',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        and "message_attachments"."width" is null
        and "message_attachments"."height" is null
        and "message_attachments"."file_name" is not null
        and char_length("message_attachments"."file_name") between 1 and 120
        and "message_attachments"."size_bytes" between 1 and 5242880
      ));