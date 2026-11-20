import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestInputSchema } from "@/lib/schemas/contest";
import { updateContest } from "@/server/services/admin-contests";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const { id } = await context.params;
    const input = await parseJson(request, contestInputSchema);
    const updated = await updateContest(staff, id, input);
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "contest.update",
      entityType: "contest",
      entityId: updated.id,
      metadata: { slug: updated.slug },
    });
    return apiOk(updated);
  } catch (error) {
    return apiError(error);
  }
}
