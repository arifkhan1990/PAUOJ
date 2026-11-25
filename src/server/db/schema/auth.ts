import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
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

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

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

export const presenceVisibilityEnum = pgEnum("presence_visibility", [
  "EVERYONE",
  "FOLLOWERS",
  "NOBODY",
]);

export const userFollowStatusEnum = pgEnum("user_follow_status", [
  "PENDING",
  "ACCEPTED",
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
    avatarPreset: text("avatar_preset"),
    avatarImageUpdatedAt: timestamp("avatar_image_updated_at", {
      withTimezone: true,
    }),
    emailVerdicts: boolean("email_verdicts").notNull().default(true),
    emailContests: boolean("email_contests").notNull().default(true),
    emailClarifications: boolean("email_clarifications").notNull().default(true),
    emailReviews: boolean("email_reviews").notNull().default(true),
    notifyMessages: boolean("notify_messages").notNull().default(true),
    notifyFollows: boolean("notify_follows").notNull().default(true),
    reviewEmailFrequency: reviewEmailFrequencyEnum("review_email_frequency")
      .notNull()
      .default("INSTANT"),
    unsubscribeToken: text("unsubscribe_token"),
    presenceVisibility: presenceVisibilityEnum("presence_visibility")
      .notNull()
      .default("EVERYONE"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
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

/**
 * Uploaded avatar bytes live apart from `users` so hot user selects and the
 * session query never load image data. `users.avatar_image_updated_at` is the
 * cheap "has an upload" flag and the cache-busting version in its URL.
 */
export const userAvatarImages = pgTable(
  "user_avatar_images",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "user_avatar_images_mime_check",
      sql`${table.mime} in ('image/png', 'image/jpeg', 'image/webp')`,
    ),
    check(
      "user_avatar_images_size_check",
      sql`octet_length(${table.bytes}) between 1 and 1048576`,
    ),
    check(
      "user_avatar_images_dimensions_check",
      sql`${table.width} between 1 and 2048 and ${table.height} between 1 and 2048`,
    ),
  ],
);

export type UserAvatarImage = typeof userAvatarImages.$inferSelect;

export const userFollows = pgTable(
  "user_follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: userFollowStatusEnum("status").notNull().default("ACCEPTED"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
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
    index("user_follows_following_status_created_idx").on(
      table.followingId,
      table.status,
      table.createdAt,
    ),
    index("user_follows_follower_status_created_idx").on(
      table.followerId,
      table.status,
      table.createdAt,
    ),
  ],
);

export type UserFollow = typeof userFollows.$inferSelect;

export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    check(
      "user_blocks_no_self_check",
      sql`${table.blockerId} <> ${table.blockedId}`,
    ),
    index("user_blocks_blocked_idx").on(table.blockedId, table.createdAt),
  ],
);

export type UserBlock = typeof userBlocks.$inferSelect;

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
