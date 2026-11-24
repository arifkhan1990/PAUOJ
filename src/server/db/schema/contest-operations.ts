import { sql } from "drizzle-orm";
import {
  check,
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
import {
  contestDivisionEnum,
  contestFormatEnum,
  contests,
} from "./contests";
import { problems } from "./problems";

export const contestStaffRoleEnum = pgEnum("contest_staff_role", [
  "DIRECTOR",
  "SETTER",
  "EDITORIAL",
  "TESTER",
  "OBSERVER",
]);

export const contestStaffStatusEnum = pgEnum("contest_staff_status", [
  "INVITED",
  "ACCEPTED",
  "DECLINED",
  "REMOVED",
]);

export const contestCandidateStatusEnum = pgEnum("contest_candidate_status", [
  "PROPOSED",
  "SHORTLISTED",
  "REJECTED",
]);

export const contestSponsorTierEnum = pgEnum("contest_sponsor_tier", [
  "TITLE",
  "GOLD",
  "SILVER",
  "COMMUNITY",
]);

export const contestSponsorStatusEnum = pgEnum("contest_sponsor_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const contestHostRequestStatusEnum = pgEnum(
  "contest_host_request_status",
  ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CONVERTED"],
);

export const contestPaymentStatusEnum = pgEnum("contest_payment_status", [
  "PENDING",
  "PAID",
  "WAIVED",
  "REFUNDED",
]);

export const contestIntegrityEventTypeEnum = pgEnum(
  "contest_integrity_event_type",
  [
    "TAB_HIDDEN",
    "PASTE",
    "COPY",
    "CONTEXT_MENU",
    "PRINT",
    "FULLSCREEN_EXIT",
    "RAPID_SUBMIT",
  ],
);

export const contestStaff = pgTable(
  "contest_staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: contestStaffRoleEnum("role").notNull(),
    status: contestStaffStatusEnum("status").notNull().default("INVITED"),
    invitedById: uuid("invited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contest_staff_contest_user_unique").on(
      table.contestId,
      table.userId,
    ),
    index("contest_staff_user_idx").on(table.userId, table.status),
    index("contest_staff_contest_role_idx").on(table.contestId, table.role),
  ],
);

export const contestStaffNotes = pgTable(
  "contest_staff_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contest_staff_notes_contest_created_idx").on(
      table.contestId,
      table.createdAt,
    ),
    index("contest_staff_notes_author_idx").on(table.authorId),
  ],
);

export const contestProblemCandidates = pgTable(
  "contest_problem_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    proposedById: uuid("proposed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: contestCandidateStatusEnum("status").notNull().default("PROPOSED"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contest_candidates_contest_problem_unique").on(
      table.contestId,
      table.problemId,
    ),
    index("contest_candidates_contest_status_idx").on(
      table.contestId,
      table.status,
    ),
  ],
);

export const contestProblemDebuts = pgTable(
  "contest_problem_debuts",
  {
    problemId: uuid("problem_id")
      .primaryKey()
      .references(() => problems.id, { onDelete: "cascade" }),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contest_problem_debuts_contest_idx").on(table.contestId)],
);

export const contestSponsors = pgTable(
  "contest_sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tier: contestSponsorTierEnum("tier").notNull().default("COMMUNITY"),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    message: text("message"),
    amountBdt: integer("amount_bdt"),
    status: contestSponsorStatusEnum("status").notNull().default("PENDING"),
    requestedById: uuid("requested_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
    index("contest_sponsors_contest_status_idx").on(
      table.contestId,
      table.status,
    ),
    index("contest_sponsors_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    check(
      "contest_sponsors_amount_check",
      sql`${table.amountBdt} is null or ${table.amountBdt} >= 0`,
    ),
  ],
);

export const contestHostRequests = pgTable(
  "contest_host_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestedById: uuid("requested_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    bannerUrl: text("banner_url"),
    format: contestFormatEnum("format").notNull().default("SINGLE"),
    division: contestDivisionEnum("division").notNull().default("OPEN"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    teamSize: integer("team_size").notNull().default(3),
    expectedParticipants: integer("expected_participants").notNull().default(50),
    sponsorNote: text("sponsor_note"),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    feeBdt: integer("fee_bdt").notNull(),
    paymentStatus: contestPaymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    paymentReference: text("payment_reference"),
    status: contestHostRequestStatusEnum("status").notNull().default("SUBMITTED"),
    adminNote: text("admin_note"),
    contestId: uuid("contest_id").references(() => contests.id, {
      onDelete: "set null",
    }),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contest_host_requests_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("contest_host_requests_user_idx").on(
      table.requestedById,
      table.createdAt,
    ),
    check(
      "contest_host_requests_fee_check",
      sql`${table.feeBdt} between 3000 and 5000`,
    ),
    check(
      "contest_host_requests_window_check",
      sql`${table.endAt} > ${table.startAt}`,
    ),
  ],
);

export const contestIntegrityEvents = pgTable(
  "contest_integrity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    type: contestIntegrityEventTypeEnum("type").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contest_integrity_events_contest_created_idx").on(
      table.contestId,
      table.createdAt,
    ),
    index("contest_integrity_events_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("contest_integrity_events_type_idx").on(table.type),
  ],
);

export type ContestStaff = typeof contestStaff.$inferSelect;
export type ContestStaffNote = typeof contestStaffNotes.$inferSelect;
export type ContestProblemCandidate = typeof contestProblemCandidates.$inferSelect;
export type ContestProblemDebut = typeof contestProblemDebuts.$inferSelect;
export type ContestSponsor = typeof contestSponsors.$inferSelect;
export type ContestHostRequest = typeof contestHostRequests.$inferSelect;
export type ContestIntegrityEvent = typeof contestIntegrityEvents.$inferSelect;
