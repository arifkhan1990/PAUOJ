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

type RouteContext = { params: Promise<{ id: string }> };

/** Browser <img> requests authenticate with the session cookie. */
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
    return new NextResponse(Buffer.from(attachment.bytes), {
      status: 200,
      headers: {
        "Content-Type": attachment.mime,
        "Content-Length": String(attachment.bytes.byteLength),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
