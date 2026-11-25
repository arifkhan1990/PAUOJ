import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { AVATAR_IMAGE_MAX_BYTES } from "@/lib/avatars";
import { avatarPresetSchema } from "@/lib/schemas/auth";
import {
  removeUserAvatarImage,
  saveUserAvatarImage,
  setAvatarPreset,
} from "@/server/services/user-avatars";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`avatar:preset:${user.id}`, 30, 60);
    const input = await parseJson(request, avatarPresetSchema);
    const selection = await setAvatarPreset(user.id, input.preset);
    const response = apiOk(selection);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`avatar:upload:${user.id}`, 10, 3600);

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
    if (file.size > AVATAR_IMAGE_MAX_BYTES) {
      throw errors.validation("Avatar images must be at most 1 MB.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const selection = await saveUserAvatarImage(user.id, bytes);
    const response = apiOk(selection);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`avatar:delete:${user.id}`, 30, 60);
    const selection = await removeUserAvatarImage(user.id);
    const response = apiOk(selection);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
