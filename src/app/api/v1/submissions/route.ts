import type { NextRequest } from "next/server";
import { assertSameOrigin, optionalApiUser, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  parseJson,
  parseQuery,
} from "@/server/api/validation";
import { createSubmissionSchema, submissionListQuerySchema } from "@/lib/schemas/submission";
import {
  createSubmission,
  listSubmissions,
} from "@/server/services/submissions";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`submission:user:${user.id}`, 5, 30, "You are submitting too quickly.");
    await enforceRateLimit(`submission:hour:${user.id}`, 100, 60 * 60);
    const input = await parseJson(request, createSubmissionSchema);
    const submission = await createSubmission(user, input);
    return apiCreated(submission);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, submissionListQuerySchema);
    const viewer = await optionalApiUser();
    if (query.mine === "true" && !viewer) throw errors.unauthorized();
    const { items, total } = await listSubmissions(
      {
        ...query,
        publicOnly: viewer?.role !== "ADMIN" && query.mine !== "true",
      },
      viewer,
    );
    return apiOk(items, pageMeta(total, query));
  } catch (error) {
    return apiError(error);
  }
}
