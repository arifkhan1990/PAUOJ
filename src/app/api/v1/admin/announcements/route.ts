import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { announcementSchema } from "@/lib/schemas/announcement";
import { publishManualAnnouncement } from "@/server/services/broadcasts";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    const input = await parseJson(request, announcementSchema);
    const result = await publishManualAnnouncement(admin.id, {
      title: input.title,
      body: input.body,
      href: input.href || null,
    });
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
