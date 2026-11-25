import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { sendMessageImageSchema } from "@/lib/schemas/messages";
import {
  MESSAGE_IMAGE_MAX_BYTES,
  MESSAGE_IMAGE_RATE_LIMIT,
  MESSAGE_IMAGE_RATE_WINDOW_SECONDS,
  sendMessageImage,
} from "@/server/services/message-images";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    // Charge the budget before parsing the multipart body so invalid or
    // oversized uploads cannot repeatedly buffer 5 MB for free.
    await enforceRateLimit(
      `message-image:${user.id}`,
      MESSAGE_IMAGE_RATE_LIMIT,
      MESSAGE_IMAGE_RATE_WINDOW_SECONDS,
      "You are sending images too quickly. Please slow down.",
    );
    const { id } = await context.params;

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw errors.validation("Upload an image file.");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw errors.validation("Upload an image file.");
    }
    if (file.size === 0) {
      throw errors.validation("That file is empty.");
    }
    if (file.size > MESSAGE_IMAGE_MAX_BYTES) {
      throw errors.validation("Images must be at most 5 MB.");
    }

    const captionValue = form.get("caption");
    const input = sendMessageImageSchema.safeParse({
      caption: typeof captionValue === "string" ? captionValue : undefined,
    });
    if (!input.success) {
      throw errors.validation(
        "Some fields are invalid.",
        input.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const item = await sendMessageImage(
      user,
      id,
      bytes,
      input.data.caption ?? "",
    );
    return apiCreated(item);
  } catch (error) {
    return apiError(error);
  }
}
