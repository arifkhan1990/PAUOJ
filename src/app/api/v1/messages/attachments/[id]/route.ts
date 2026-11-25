import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError } from "@/server/api/responses";
import {
  getMessageAttachment,
  MESSAGE_ATTACHMENT_RATE_LIMIT,
  MESSAGE_ATTACHMENT_RATE_WINDOW_SECONDS,
} from "@/server/services/message-images";
import { documentContentDisposition } from "@/server/services/message-documents";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Browser <img> and download requests authenticate with the session cookie.
 * Images render inline; documents always download as opaque bytes so a shared
 * file can never execute in the app origin.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(
      `message-attachment:${user.id}`,
      MESSAGE_ATTACHMENT_RATE_LIMIT,
      MESSAGE_ATTACHMENT_RATE_WINDOW_SECONDS,
    );
    const { id } = await context.params;
    const attachment = await getMessageAttachment(user.id, id);
    if (!attachment) {
      throw errors.notFound("Attachment not found.");
    }
    const isDocument = attachment.kind === "DOCUMENT";
    return new NextResponse(Buffer.from(attachment.bytes), {
      status: 200,
      headers: {
        "Content-Type": isDocument ? "application/octet-stream" : attachment.mime,
        "Content-Length": String(attachment.bytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition":
          attachment.kind === "DOCUMENT"
            ? documentContentDisposition(attachment.fileName)
            : "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
