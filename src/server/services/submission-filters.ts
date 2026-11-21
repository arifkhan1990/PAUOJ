import { isNull, type SQL } from "drizzle-orm";
import { submissions } from "@/server/db/schema";

/**
 * Condition shared by the aggregates that represent public practice/rank
 * data. Invigilated assessment submissions must never count toward rank,
 * problem statistics or practice activity (PRD v0.6.0, E6).
 */
export function countedSubmission(): SQL {
  return isNull(submissions.assessmentId);
}
