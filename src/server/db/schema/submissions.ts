import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { assessments } from "./assessments";
import { contests, virtualContests } from "./contests";
import { problems, testCases } from "./problems";

export const languageEnum = pgEnum("language", [
  "c",
  "cpp",
  "python",
  "javascript",
  "java",
  "csharp",
  "go",
  "php",
  "kotlin",
  "swift",
  "sql",
  "mysql",
  "postgresql",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "QUEUED",
  "JUDGING",
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "OUTPUT_LIMIT_EXCEEDED",
  "SYSTEM_ERROR",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    contestId: uuid("contest_id").references(() => contests.id, {
      onDelete: "set null",
    }),
    virtualContestId: uuid("virtual_contest_id").references(
      () => virtualContests.id,
      { onDelete: "set null" },
    ),
    assessmentId: uuid("assessment_id").references(() => assessments.id, {
      onDelete: "set null",
    }),
    language: languageEnum("language").notNull(),
    sourceCode: text("source_code").notNull(),
    status: submissionStatusEnum("status").notNull().default("QUEUED"),
    passedTests: integer("passed_tests").notNull().default(0),
    totalTests: integer("total_tests").notNull().default(0),
    runtimeMs: integer("runtime_ms"),
    memoryKb: integer("memory_kb"),
    compileOutput: text("compile_output"),
    errorMessage: text("error_message"),
    judgedAt: timestamp("judged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("submissions_user_created_idx").on(table.userId, table.createdAt),
    index("submissions_problem_created_idx").on(
      table.problemId,
      table.createdAt,
    ),
    index("submissions_contest_created_idx").on(
      table.contestId,
      table.createdAt,
    ),
    index("submissions_virtual_created_idx").on(
      table.virtualContestId,
      table.createdAt,
    ),
    index("submissions_assessment_created_idx").on(
      table.assessmentId,
      table.createdAt,
    ),
    index("submissions_status_idx").on(table.status),
    index("submissions_created_idx").on(table.createdAt),
  ],
);

export const submissionResults = pgTable(
  "submission_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    testCaseId: uuid("test_case_id").references(() => testCases.id, {
      onDelete: "set null",
    }),
    position: integer("position").notNull(),
    status: submissionStatusEnum("status").notNull(),
    runtimeMs: integer("runtime_ms"),
    memoryKb: integer("memory_kb"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submission_results_position_unique").on(
      table.submissionId,
      table.position,
    ),
    index("submission_results_submission_idx").on(table.submissionId),
  ],
);

export type Submission = typeof submissions.$inferSelect;
export type SubmissionResult = typeof submissionResults.$inferSelect;
export type SubmissionStatus = Submission["status"];
export type Language = Submission["language"];
