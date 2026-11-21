import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { problems } from "./problems";

export const assessmentJoinModeEnum = pgEnum("assessment_join_mode", [
  "OPEN_CODE",
  "INVITE",
]);

export const assessmentInviteStatusEnum = pgEnum("assessment_invite_status", [
  "UNSENT",
  "SENT",
  "OPENED",
  "CLAIMED",
  "REVOKED",
  "EXPIRED",
]);

export const assessmentClaimAssuranceEnum = pgEnum(
  "assessment_claim_assurance",
  ["VERIFIED_EMAIL", "EMAIL_MATCH", "REF_MATCH"],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    accessCode: text("access_code").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes"),
    joinMode: assessmentJoinModeEnum("join_mode").notNull().default("OPEN_CODE"),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("assessments_slug_unique").on(table.slug),
    uniqueIndex("assessments_access_code_unique").on(table.accessCode),
    index("assessments_start_idx").on(table.startAt),
    index("assessments_end_idx").on(table.endAt),
    index("assessments_published_idx").on(table.isPublished),
  ],
);

export const assessmentProblems = pgTable(
  "assessment_problems",
  {
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: text("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.assessmentId, table.problemId] }),
    uniqueIndex("assessment_problems_label_unique").on(
      table.assessmentId,
      table.label,
    ),
    uniqueIndex("assessment_problems_position_unique").on(
      table.assessmentId,
      table.position,
    ),
    index("assessment_problems_problem_idx").on(table.problemId),
  ],
);

export const assessmentInvites = pgTable(
  "assessment_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    candidateRef: text("candidate_ref").notNull(),
    email: text("email"),
    groupLabel: text("group_label"),
    candidateName: text("candidate_name"),
    tokenHash: text("token_hash").notNull(),
    status: assessmentInviteStatusEnum("status").notNull().default("UNSENT"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    sendCount: integer("send_count").notNull().default(0),
    sendWindowStartedAt: timestamp("send_window_started_at", {
      withTimezone: true,
    }),
    sendWindowCount: integer("send_window_count").notNull().default(0),
    sendLockAt: timestamp("send_lock_at", { withTimezone: true }),
    failedClaimCount: integer("failed_claim_count").notNull().default(0),
    lastFailedClaimAt: timestamp("last_failed_claim_at", { withTimezone: true }),
    claimFailWindowStartedAt: timestamp("claim_fail_window_started_at", {
      withTimezone: true,
    }),
    claimFailWindowCount: integer("claim_fail_window_count")
      .notNull()
      .default(0),
    claimedByUserId: uuid("claimed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    claimedAssurance: assessmentClaimAssuranceEnum("claimed_assurance"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("assessment_invites_token_hash_unique").on(table.tokenHash),
    uniqueIndex("assessment_invites_assessment_ref_unique").on(
      table.assessmentId,
      sql`upper(btrim(${table.candidateRef}))`,
    ),
    uniqueIndex("assessment_invites_assessment_email_unique")
      .on(table.assessmentId, sql`lower(${table.email})`)
      .where(sql`${table.email} is not null`),
    index("assessment_invites_assessment_status_idx").on(
      table.assessmentId,
      table.status,
    ),
    index("assessment_invites_assessment_group_idx").on(
      table.assessmentId,
      table.groupLabel,
    ),
  ],
);

export const assessmentParticipants = pgTable(
  "assessment_participants",
  {
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteId: uuid("invite_id").references(() => assessmentInvites.id, {
      onDelete: "set null",
    }),
    assurance: assessmentClaimAssuranceEnum("assurance"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.assessmentId, table.userId] }),
    index("assessment_participants_user_idx").on(table.userId),
    index("assessment_participants_expires_idx").on(table.expiresAt),
    uniqueIndex("assessment_participants_invite_unique")
      .on(table.inviteId)
      .where(sql`${table.inviteId} is not null`),
  ],
);

export type Assessment = typeof assessments.$inferSelect;
export type AssessmentProblem = typeof assessmentProblems.$inferSelect;
export type AssessmentParticipant = typeof assessmentParticipants.$inferSelect;
export type AssessmentInvite = typeof assessmentInvites.$inferSelect;
