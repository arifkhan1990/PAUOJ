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

export const userRoleEnum = pgEnum("user_role", ["USER", "TEACHER", "ADMIN"]);

export const reviewEmailFrequencyEnum = pgEnum("review_email_frequency", [
  "INSTANT",
  "HOURLY",
  "DAILY",
]);

export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
]);

export const userCurrentStatusEnum = pgEnum("user_current_status", [
  "STUDENT",
  "EMPLOYED",
  "FREELANCER",
  "JOB_SEEKER",
  "OTHER",
]);

export const tshirtSizeEnum = pgEnum("tshirt_size", [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: userRoleEnum("role").notNull().default("USER"),
    rating: integer("rating").notNull().default(1500),
    bio: text("bio"),
    country: text("country"),
    institution: text("institution"),
    website: text("website"),
    github: text("github"),
    linkedin: text("linkedin"),
    address: text("address"),
    phone: text("phone"),
    currentStatus: userCurrentStatusEnum("current_status"),
    companyName: text("company_name"),
    jobTitle: text("job_title"),
    skills: text("skills").array(),
    tshirtSize: tshirtSizeEnum("tshirt_size"),
    emailVerdicts: boolean("email_verdicts").notNull().default(true),
    emailContests: boolean("email_contests").notNull().default(true),
    emailClarifications: boolean("email_clarifications").notNull().default(true),
    emailReviews: boolean("email_reviews").notNull().default(true),
    reviewEmailFrequency: reviewEmailFrequencyEnum("review_email_frequency")
      .notNull()
      .default("INSTANT"),
    unsubscribeToken: text("unsubscribe_token"),
    isBanned: boolean("is_banned").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_unsubscribe_token_unique").on(table.unsubscribeToken),
    index("users_role_idx").on(table.role),
  ],
);

export const userFollows = pgTable(
  "user_follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    check(
      "user_follows_no_self_check",
      sql`${table.followerId} <> ${table.followingId}`,
    ),
    index("user_follows_following_created_idx").on(
      table.followingId,
      table.createdAt,
    ),
    index("user_follows_follower_created_idx").on(
      table.followerId,
      table.createdAt,
    ),
  ],
);

export type UserFollow = typeof userFollows.$inferSelect;

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expiresAt),
  ],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_tokens_hash_unique").on(table.tokenHash),
    index("auth_tokens_user_type_idx").on(table.userId, table.type),
    index("auth_tokens_expires_idx").on(table.expiresAt),
  ],
);

export type User = typeof users.$inferSelect;
export type UserRole = User["role"];
export type AuthTokenType = (typeof authTokenTypeEnum.enumValues)[number];
