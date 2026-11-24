import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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

export const contestDivisionEnum = pgEnum("contest_division", [
  "OPEN",
  "DIV1",
  "DIV2",
  "DIV3",
  "DIV4",
]);

export const contestFormatEnum = pgEnum("contest_format", ["SINGLE", "GROUP"]);

export const contestFeeStatusEnum = pgEnum("contest_fee_status", [
  "NOT_REQUIRED",
  "PENDING",
  "PAID",
  "WAIVED",
  "REFUNDED",
]);

export const contestSeriesCadenceEnum = pgEnum("contest_series_cadence", [
  "MONTHLY_THIRD_SUNDAY",
]);

export const contestTeamStatusEnum = pgEnum("contest_team_status", [
  "FORMING",
  "REGISTERED",
  "WITHDRAWN",
  "DISQUALIFIED",
]);

export const contestTeamInviteStatusEnum = pgEnum(
  "contest_team_invite_status",
  ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED"],
);

export const contestSeries = pgTable(
  "contest_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    format: contestFormatEnum("format").notNull().default("SINGLE"),
    division: contestDivisionEnum("division").notNull().default("OPEN"),
    cadence: contestSeriesCadenceEnum("cadence")
      .notNull()
      .default("MONTHLY_THIRD_SUNDAY"),
    timezone: text("timezone").notNull().default("Asia/Dhaka"),
    weekOfMonth: integer("week_of_month").notNull().default(3),
    weekday: integer("weekday").notNull().default(0),
    hour: integer("hour").notNull().default(10),
    minute: integer("minute").notNull().default(0),
    durationMinutes: integer("duration_minutes").notNull().default(90),
    teamSize: integer("team_size").notNull().default(3),
    isActive: boolean("is_active").notNull().default(true),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
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
    uniqueIndex("contest_series_key_unique").on(table.key),
    index("contest_series_active_idx").on(table.isActive, table.nextRunAt),
  ],
);

export const contests = pgTable(
  "contests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    bannerUrl: text("banner_url"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    division: contestDivisionEnum("division").notNull().default("OPEN"),
    format: contestFormatEnum("format").notNull().default("SINGLE"),
    teamSize: integer("team_size").notNull().default(3),
    seriesId: uuid("series_id").references(() => contestSeries.id, {
      onDelete: "set null",
    }),
    isOfficial: boolean("is_official").notNull().default(false),
    autoCreated: boolean("auto_created").notNull().default(false),
    feeStatus: contestFeeStatusEnum("fee_status")
      .notNull()
      .default("NOT_REQUIRED"),
    feeBdt: integer("fee_bdt"),
    feeReference: text("fee_reference"),
    requiresFreshProblems: boolean("requires_fresh_problems")
      .notNull()
      .default(true),
    eligibility: text("eligibility"),
    rules: text("rules"),
    prizes: text("prizes"),
    freezeMinutes: integer("freeze_minutes").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ratedAt: timestamp("rated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contests_slug_unique").on(table.slug),
    uniqueIndex("contests_series_occurrence_unique").on(
      table.seriesId,
      table.startAt,
    ),
    index("contests_start_idx").on(table.startAt),
    index("contests_end_idx").on(table.endAt),
    index("contests_format_start_idx").on(table.format, table.startAt),
    check(
      "contests_team_size_check",
      sql`${table.teamSize} between 2 and 6`,
    ),
    check(
      "contests_fee_bdt_check",
      sql`${table.feeBdt} is null or ${table.feeBdt} between 3000 and 5000`,
    ),
  ],
);

export const contestProblems = pgTable(
  "contest_problems",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: text("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.problemId] }),
    uniqueIndex("contest_problems_label_unique").on(
      table.contestId,
      table.label,
    ),
    uniqueIndex("contest_problems_position_unique").on(
      table.contestId,
      table.position,
    ),
    index("contest_problems_problem_idx").on(table.problemId),
  ],
);

export const contestTeams = pgTable(
  "contest_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    inviteCode: text("invite_code").notNull(),
    captainId: uuid("captain_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    maxMembers: integer("max_members").notNull().default(3),
    status: contestTeamStatusEnum("status").notNull().default("FORMING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contest_teams_name_unique").on(table.contestId, table.name),
    uniqueIndex("contest_teams_invite_unique").on(table.inviteCode),
    index("contest_teams_contest_idx").on(table.contestId),
    index("contest_teams_captain_idx").on(table.captainId),
    check(
      "contest_teams_max_members_check",
      sql`${table.maxMembers} between 2 and 6`,
    ),
  ],
);

export const contestTeamMembers = pgTable(
  "contest_team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => contestTeams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    index("contest_team_members_user_idx").on(table.userId),
    check(
      "contest_team_members_role_check",
      sql`${table.role} in ('CAPTAIN', 'MEMBER')`,
    ),
  ],
);

export const contestTeamInvites = pgTable(
  "contest_team_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => contestTeams.id, { onDelete: "cascade" }),
    invitedUserId: uuid("invited_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedById: uuid("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: contestTeamInviteStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contest_team_invites_team_user_unique").on(
      table.teamId,
      table.invitedUserId,
    ),
    index("contest_team_invites_user_status_idx").on(
      table.invitedUserId,
      table.status,
    ),
    index("contest_team_invites_contest_status_idx").on(
      table.contestId,
      table.status,
    ),
  ],
);

export const contestRegistrations = pgTable(
  "contest_registrations",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => contestTeams.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.userId] }),
    index("contest_registrations_user_idx").on(table.userId),
    index("contest_registrations_team_idx").on(table.teamId),
  ],
);

export const contestClarifications = pgTable(
  "contest_clarifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer"),
    answeredById: uuid("answered_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contest_clarifications_contest_created_idx").on(
      table.contestId,
      table.createdAt,
    ),
    index("contest_clarifications_problem_idx").on(table.problemId),
    index("contest_clarifications_user_idx").on(table.userId),
  ],
);

export const contestRatingChanges = pgTable(
  "contest_rating_changes",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    oldRating: integer("old_rating").notNull(),
    newRating: integer("new_rating").notNull(),
    delta: integer("delta").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.userId] }),
    index("contest_rating_changes_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const virtualContests = pgTable(
  "virtual_contests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("virtual_contests_contest_user_unique").on(
      table.contestId,
      table.userId,
    ),
    index("virtual_contests_user_idx").on(table.userId),
  ],
);

export type Contest = typeof contests.$inferSelect;
export type ContestSeries = typeof contestSeries.$inferSelect;
export type ContestTeam = typeof contestTeams.$inferSelect;
export type ContestTeamMember = typeof contestTeamMembers.$inferSelect;
export type ContestTeamInvite = typeof contestTeamInvites.$inferSelect;
export type VirtualContest = typeof virtualContests.$inferSelect;
export type ContestProblem = typeof contestProblems.$inferSelect;
export type ContestClarification = typeof contestClarifications.$inferSelect;
export type ContestRatingChange = typeof contestRatingChanges.$inferSelect;
