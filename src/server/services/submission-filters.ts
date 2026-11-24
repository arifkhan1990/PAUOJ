import { and, eq, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { contests, problems, submissions } from "@/server/db/schema";

/**
 * Condition shared by the aggregates that represent public practice/rank
 * data. Invigilated assessment submissions must never count toward rank,
 * problem statistics or practice activity (PRD v0.6.0, E6).
 */
export function countedSubmission(): SQL {
  return isNull(submissions.assessmentId);
}

/**
 * Practice-only guard: public practice aggregates exclude both invigilated
 * assessments and virtual-contest submissions (PRD v0.6.0, E6).
 */
export function practiceSubmissionCondition(): SQL {
  return and(countedSubmission(), isNull(submissions.virtualContestId))!;
}

/**
 * Visibility guard for public submission feeds: published problems only, no
 * assessment rows, and contest rows only after a public contest has ended.
 * Callers must join `problems` and left join `contests`.
 */
export function publicSubmissionCondition(now = new Date()): SQL {
  return and(
    countedSubmission(),
    eq(problems.isPublic, true),
    or(
      isNull(submissions.contestId),
      and(eq(contests.isPublic, true), lte(contests.endAt, now))!,
    )!,
  )!;
}

/**
 * `sql` is the legacy SQLite value. A SQLite filter includes both names so old
 * submissions stay visible after the `sqlite` language was added.
 */
export function languageFilterCondition(
  language: (typeof submissions.$inferSelect)["language"],
): SQL {
  return inArray(
    submissions.language,
    language === "sqlite" ? ["sql", "sqlite"] : [language],
  );
}
