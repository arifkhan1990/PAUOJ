import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemInputSchema } from "@/lib/schemas/problem";
import { updateProblem } from "@/server/services/admin-problems";
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
    const input = await parseJson(request, problemInputSchema);
    const updated = await updateProblem(id, input, staff);
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "problem.update",
      entityType: "problem",
      entityId: updated.id,
      metadata: { slug: updated.slug },
    });
    return apiOk(updated);
  } catch (error) {
    return apiError(error);
  }
}
