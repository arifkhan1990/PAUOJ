import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import {
  MESSAGE_DOCUMENT_MAX_BYTES,
  MESSAGE_DOCUMENT_RATE_LIMIT,
  MESSAGE_DOCUMENT_RATE_WINDOW_SECONDS,
  sendMessageDocument,
} from "@/server/services/message-documents";
import { uploadExceedsLimit } from "@/server/services/message-images";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    // Charge the budget before parsing the multipart body so invalid or
    // oversized uploads cannot repeatedly buffer 5 MB for free.
    await enforceRateLimit(
      `message-document:${user.id}`,
      MESSAGE_DOCUMENT_RATE_LIMIT,
      MESSAGE_DOCUMENT_RATE_WINDOW_SECONDS,
      "You are sending files too quickly. Please slow down.",
    );
    const { id } = await context.params;

    // Reject a declared oversized body before `formData()` buffers it. The
    // per-file cap below still runs as defense in depth.
    if (uploadExceedsLimit(request.headers.get("content-length"))) {
      throw errors.validation("Files must be at most 5 MB.");
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw errors.validation("Upload a document file.");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw errors.validation("Upload a document file.");
    }
    if (file.size === 0) {
      throw errors.validation("That file is empty.");
    }
    if (file.size > MESSAGE_DOCUMENT_MAX_BYTES) {
      throw errors.validation("Files must be at most 5 MB.");
    }

    const captionValue = form.get("caption");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const item = await sendMessageDocument(
      user,
      id,
      bytes,
      file.name,
      typeof captionValue === "string" ? captionValue : "",
    );
    return apiCreated(item);
  } catch (error) {
    return apiError(error);
  }
}
