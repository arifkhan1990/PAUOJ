import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ProblemContributionPayload } from "@/lib/contribution-types";
import { users } from "./auth";
import { problems } from "./problems";

export const problemContributionKindEnum = pgEnum(
  "problem_contribution_kind",
  ["STATEMENT", "TESTS", "EDITORIAL"],
);

export const problemContributionStatusEnum = pgEnum(
  "problem_contribution_status",
  ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"],
);

export const problemContributions = pgTable(
  "problem_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    contributorId: uuid("contributor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: problemContributionKindEnum("kind").notNull(),
    payload: jsonb("payload").$type<ProblemContributionPayload>().notNull(),
    note: text("note"),
    status: problemContributionStatusEnum("status").notNull().default("PENDING"),
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
    uniqueIndex("problem_contributions_pending_unique")
      .on(table.problemId, table.contributorId, table.kind)
      .where(sql`${table.status} = 'PENDING'`),
    index("problem_contributions_problem_status_created_idx").on(
      table.problemId,
      table.status,
      table.createdAt,
    ),
    index("problem_contributions_contributor_created_idx").on(
      table.contributorId,
      table.createdAt,
    ),
    index("problem_contributions_reviewed_idx")
      .on(table.reviewedAt, table.reviewedById)
      .where(
        sql`${table.status} in ('APPROVED', 'REJECTED') and ${table.reviewedById} is not null`,
      ),
  ],
);

export type ProblemContribution = typeof problemContributions.$inferSelect;
