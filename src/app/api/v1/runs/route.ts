import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { runCodeSchema } from "@/lib/schemas/submission";
import { normalizeJudgeOutput } from "@/server/judge/compare-output";
import { getProblemForSubmission } from "@/server/services/problem-submission-context";
import { getRunReference } from "@/server/services/problem-reference";
import { createRun, type CreateRunInput } from "@/server/services/runs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`run:user:${user.id}`, 10, 60, "You are running code too quickly.");
    const input = await parseJson(request, runCodeSchema);

    let timeLimitMs = 2000;
    let memoryLimitMb = 256;
    let sqlScript = false;
    let reference: CreateRunInput["reference"] = null;
    let checker: CreateRunInput["checker"] = null;
    if (input.problemId) {
      const { problem, contestContext, assessmentContext } =
        await getProblemForSubmission(
          input.problemId,
          user.id,
          user.role === "ADMIN",
        );
      timeLimitMs = Math.min(problem.timeLimitMs, 10_000);
      memoryLimitMb = Math.min(problem.memoryLimitMb, 1024);
      sqlScript = problem.judgeLanguage === "sql-script";
      if (!contestContext && !assessmentContext) {
        // Official samples already carry the expected answer to the client;
        // running the reference for them would add a second sandbox run.
        // SQL problems ignore stdin (the query is the input), so sample
        // matching against stdin is never meaningful for them.
        const isSqlProblem =
          problem.judgeLanguage === "sql" ||
          problem.judgeLanguage === "sql-script";
        const normalizedStdin = normalizeJudgeOutput(input.stdin);
        const matchesSample =
          !isSqlProblem &&
          problem.samples.some(
            (sample) => normalizeJudgeOutput(sample.input) === normalizedStdin,
          );
        if (!matchesSample) {
          const runReference = await getRunReference(problem.id);
          if (runReference) {
            reference = runReference.reference;
            checker = {
              type: runReference.checkerType,
              floatTolerance: runReference.floatTolerance,
            };
          }
        }
      }
    }

    const runId = await createRun({
      userId: user.id,
      language: input.language,
      source: input.source,
      stdin: input.stdin,
      timeLimitMs,
      memoryLimitMb,
      sqlScript,
      reference,
      checker,
    });
    return apiCreated({ runId });
  } catch (error) {
    return apiError(error);
  }
}
