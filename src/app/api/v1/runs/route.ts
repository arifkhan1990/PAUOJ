import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { runCodeSchema } from "@/lib/schemas/submission";
import { getProblemForSubmission } from "@/server/services/problems";
import { createRun } from "@/server/services/runs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`run:user:${user.id}`, 10, 60, "You are running code too quickly.");
    const input = await parseJson(request, runCodeSchema);

    let timeLimitMs = 2000;
    let memoryLimitMb = 256;
    let sqlScript = false;
    if (input.problemId) {
      const { problem } = await getProblemForSubmission(
        input.problemId,
        user.id,
        user.role === "ADMIN",
      );
      timeLimitMs = Math.min(problem.timeLimitMs, 10_000);
      memoryLimitMb = Math.min(problem.memoryLimitMb, 1024);
      sqlScript = problem.judgeLanguage === "sql-script";
    }

    const runId = await createRun({
      userId: user.id,
      language: input.language,
      source: input.source,
      stdin: input.stdin,
      timeLimitMs,
      memoryLimitMb,
      sqlScript,
    });
    return apiCreated({ runId });
  } catch (error) {
    return apiError(error);
  }
}
