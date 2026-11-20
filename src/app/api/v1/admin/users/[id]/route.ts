import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { updateUserRole, setUserBanned } from "@/server/services/auth";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

const bodySchema = z
  .object({
    role: z.enum(["USER", "TEACHER", "ADMIN"]).optional(),
    banned: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.banned !== undefined, {
    message: "Nothing to update.",
  });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    const { id } = await context.params;
    const input = await parseJson(request, bodySchema);

    if (input.role) await updateUserRole(admin.id, id, input.role);
    if (input.banned !== undefined) {
      await setUserBanned(admin.id, id, input.banned);
    }

    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "user.update",
      entityType: "user",
      entityId: id,
      metadata: { role: input.role, banned: input.banned },
    });
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
