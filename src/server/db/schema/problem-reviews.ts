import { sql } from "drizzle-orm";
import {
  boolean,
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
import { problems } from "./problems";

export const problemReviewApprovalStatusEnum = pgEnum(
  "problem_review_approval_status",
  ["ACTIVE", "SUPERSEDED"],
);

export const problemReviewHoldStatusEnum = pgEnum(
  "problem_review_hold_status",
  ["OPEN", "ADDRESSED", "RESOLVED"],
);

export const problemReviewApprovals = pgTable(
  "problem_review_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cycle: integer("cycle").notNull(),
    status: problemReviewApprovalStatusEnum("status")
      .notNull()
      .default("ACTIVE"),
    note: text("note"),
    solutionLanguage: text("solution_language").notNull(),
    solutionSource: text("solution_source").notNull(),
    testsAdded: integer("tests_added").notNull().default(0),
    editorialProvided: boolean("editorial_provided")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("problem_review_approvals_unique").on(
      table.problemId,
      table.reviewerId,
      table.cycle,
    ),
    index("problem_review_approvals_problem_idx").on(
      table.problemId,
      table.cycle,
      table.status,
    ),
    index("problem_review_approvals_reviewer_idx").on(
      table.reviewerId,
      table.createdAt,
    ),
  ],
);

export const problemReviewHolds = pgTable(
  "problem_review_holds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cycle: integer("cycle").notNull(),
    status: problemReviewHoldStatusEnum("status").notNull().default("OPEN"),
    note: text("note").notNull(),
    authorResponse: text("author_response"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    reopenNote: text("reopen_note"),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("problem_review_holds_active_unique")
      .on(table.problemId, table.reviewerId)
      .where(sql`${table.status} in ('OPEN', 'ADDRESSED')`),
    index("problem_review_holds_problem_idx").on(
      table.problemId,
      table.status,
      table.createdAt,
    ),
    index("problem_review_holds_reviewer_idx").on(
      table.reviewerId,
      table.createdAt,
    ),
  ],
);

export type ProblemReviewApproval = typeof problemReviewApprovals.$inferSelect;
export type ProblemReviewHold = typeof problemReviewHolds.$inferSelect;
export type ProblemReviewApprovalStatus =
  ProblemReviewApproval["status"];
export type ProblemReviewHoldStatus = ProblemReviewHold["status"];
