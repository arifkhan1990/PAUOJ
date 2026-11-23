import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { SQL_LAB_TASKS } from "@/lib/sql-lab/tasks";
import { getEntitledModuleSlugs } from "@/server/services/learning-payments";
import { completeSqlLabTask } from "@/server/services/sql-lab";

const schema = z.object({ taskId: z.string().trim().min(1).max(60) });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`sql-lab:progress-rate:${user.id}`, 60, 60);
    const input = await parseJson(request, schema);
    const task = SQL_LAB_TASKS.find((item) => item.id === input.taskId);
    if (!task) throw errors.notFound("Task not found.");
    if (task.level === "advanced" && user.role !== "ADMIN") {
      const entitled = await getEntitledModuleSlugs(user.id, user.role);
      if (!entitled.has("advanced-sql")) {
        throw errors.forbidden("Advanced SQL requires a purchase.");
      }
    }
    const completed = await completeSqlLabTask(user.id, task.id);
    return apiOk({ completed });
  } catch (error) {
    return apiError(error);
  }
}
