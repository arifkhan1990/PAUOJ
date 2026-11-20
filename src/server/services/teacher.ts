import { and, count, eq, gt, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  assessmentParticipants,
  assessments,
  contestRegistrations,
  contests,
  problems,
  problemContributions,
  submissions,
} from "@/server/db/schema";
import type {
  AdminAssessmentListItem,
  AdminContestListItem,
  AdminProblemListItem,
} from "@/lib/types";
import { listAdminAssessments } from "./admin-assessments";
import { listAdminContests } from "./admin-contests";
import { listAdminProblems } from "./admin-problems";

export type TeacherOverview = {
  problemCount: number;
  publicProblemCount: number;
  contestCount: number;
  runningContestCount: number;
  assessmentCount: number;
  publishedAssessmentCount: number;
  participantCount: number;
  submissionCount: number;
  acceptedCount: number;
  pendingContributions: number;
  recentAssessments: AdminAssessmentListItem[];
  recentContests: AdminContestListItem[];
  recentProblems: AdminProblemListItem[];
};

export async function getTeacherOverview(
  teacherId: string,
): Promise<TeacherOverview> {
  const db = getDb();
  const now = new Date();

  const [
    problemRow,
    publicProblemRow,
    contestRow,
    runningContestRow,
    assessmentRow,
    publishedAssessmentRow,
    assessmentParticipantRow,
    contestRegistrationRow,
    submissionRow,
    acceptedRow,
    contributionRow,
    assessmentPage,
    contestPage,
    problemPage,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(problems)
      .where(eq(problems.authorId, teacherId)),
    db
      .select({ value: count() })
      .from(problems)
      .where(and(eq(problems.authorId, teacherId), eq(problems.isPublic, true))),
    db
      .select({ value: count() })
      .from(contests)
      .where(eq(contests.createdBy, teacherId)),
    db
      .select({ value: count() })
      .from(contests)
      .where(
        and(
          eq(contests.createdBy, teacherId),
          lte(contests.startAt, now),
          gt(contests.endAt, now),
        ),
      ),
    db
      .select({ value: count() })
      .from(assessments)
      .where(eq(assessments.createdBy, teacherId)),
    db
      .select({ value: count() })
      .from(assessments)
      .where(
        and(
          eq(assessments.createdBy, teacherId),
          eq(assessments.isPublished, true),
        ),
      ),
    db
      .select({ value: count() })
      .from(assessmentParticipants)
      .innerJoin(
        assessments,
        eq(assessments.id, assessmentParticipants.assessmentId),
      )
      .where(eq(assessments.createdBy, teacherId)),
    db
      .select({ value: count() })
      .from(contestRegistrations)
      .innerJoin(contests, eq(contests.id, contestRegistrations.contestId))
      .where(eq(contests.createdBy, teacherId)),
    db
      .select({ value: count() })
      .from(submissions)
      .innerJoin(problems, eq(problems.id, submissions.problemId))
      .where(eq(problems.authorId, teacherId)),
    db
      .select({ value: count() })
      .from(submissions)
      .innerJoin(problems, eq(problems.id, submissions.problemId))
      .where(
        and(
          eq(problems.authorId, teacherId),
          eq(submissions.status, "ACCEPTED"),
        ),
      ),
    db
      .select({ value: count() })
      .from(problemContributions)
      .innerJoin(problems, eq(problems.id, problemContributions.problemId))
      .where(
        and(
          eq(problems.authorId, teacherId),
          eq(problemContributions.status, "PENDING"),
        ),
      ),
    listAdminAssessments({ page: 1, pageSize: 4 }, teacherId),
    listAdminContests({ page: 1, pageSize: 4 }, teacherId),
    listAdminProblems({ page: 1, pageSize: 5 }, undefined, teacherId),
  ]);

  return {
    problemCount: Number(problemRow[0]?.value ?? 0),
    publicProblemCount: Number(publicProblemRow[0]?.value ?? 0),
    contestCount: Number(contestRow[0]?.value ?? 0),
    runningContestCount: Number(runningContestRow[0]?.value ?? 0),
    assessmentCount: Number(assessmentRow[0]?.value ?? 0),
    publishedAssessmentCount: Number(publishedAssessmentRow[0]?.value ?? 0),
    participantCount:
      Number(assessmentParticipantRow[0]?.value ?? 0) +
      Number(contestRegistrationRow[0]?.value ?? 0),
    submissionCount: Number(submissionRow[0]?.value ?? 0),
    acceptedCount: Number(acceptedRow[0]?.value ?? 0),
    pendingContributions: Number(contributionRow[0]?.value ?? 0),
    recentAssessments: assessmentPage.items,
    recentContests: contestPage.items,
    recentProblems: problemPage.items,
  };
}
