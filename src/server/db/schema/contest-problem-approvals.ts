import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { contests } from "./contests";
import { problems } from "./problems";

export const contestProblemApprovalStatusEnum = pgEnum(
  "contest_problem_approval_status",
  ["PENDING", "APPROVED", "REJECTED"],
);

export const contestProblemApprovals = pgTable(
  "contest_problem_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    requestedById: uuid("requested_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: contestProblemApprovalStatusEnum("status").notNull().default("PENDING"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contest_problem_approvals_contest_problem_unique").on(
      table.contestId,
      table.problemId,
    ),
    index("contest_problem_approvals_author_status_idx").on(
      table.authorId,
      table.status,
      table.createdAt,
    ),
    index("contest_problem_approvals_contest_status_idx").on(
      table.contestId,
      table.status,
    ),
  ],
);

export type ContestProblemApproval =
  typeof contestProblemApprovals.$inferSelect;
