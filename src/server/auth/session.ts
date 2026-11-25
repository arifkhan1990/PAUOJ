import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { getEnv } from "@/server/env";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { touchPresence } from "@/server/services/presence";

export { SESSION_COOKIE };
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type SafeUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
  rating: number;
  bio: string | null;
  country: string | null;
  institution: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  address: string | null;
  phone: string | null;
  currentStatus:
    | "STUDENT"
    | "EMPLOYED"
    | "FREELANCER"
    | "JOB_SEEKER"
    | "OTHER"
    | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: string[];
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | null;
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | null;
  presenceVisibility: "EVERYONE" | "FOLLOWERS" | "NOBODY";
  emailVerdicts: boolean;
  emailContests: boolean;
  emailClarifications: boolean;
  emailReviews: boolean;
  emailAccount: boolean;
  emailLearning: boolean;
  emailAchievements: boolean;
  emailAnnouncements: boolean;
  emailMarketing: boolean;
  emailDiscussions: boolean;
  emailMessages: boolean;
  emailFollows: boolean;
  notifyMessages: boolean;
  notifyFollows: boolean;
  notifyMarketing: boolean;
  reviewEmailFrequency: "INSTANT" | "HOURLY" | "DAILY";
  isBanned: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function toSafeUser(user: {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
  rating: number;
  bio: string | null;
  country: string | null;
  institution: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  address: string | null;
  phone: string | null;
  currentStatus:
    | "STUDENT"
    | "EMPLOYED"
    | "FREELANCER"
    | "JOB_SEEKER"
    | "OTHER"
    | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: string[] | null;
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | null;
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | null;
  presenceVisibility: "EVERYONE" | "FOLLOWERS" | "NOBODY";
  emailVerdicts: boolean;
  emailContests: boolean;
  emailClarifications: boolean;
  emailReviews: boolean;
  emailAccount: boolean;
  emailLearning: boolean;
  emailAchievements: boolean;
  emailAnnouncements: boolean;
  emailMarketing: boolean;
  emailDiscussions: boolean;
  emailMessages: boolean;
  emailFollows: boolean;
  notifyMessages: boolean;
  notifyFollows: boolean;
  notifyMarketing: boolean;
  reviewEmailFrequency: "INSTANT" | "HOURLY" | "DAILY";
  isBanned: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    rating: user.rating,
    bio: user.bio,
    country: user.country,
    institution: user.institution,
    website: user.website,
    github: user.github,
    linkedin: user.linkedin,
    address: user.address,
    phone: user.phone,
    currentStatus: user.currentStatus,
    companyName: user.companyName,
    jobTitle: user.jobTitle,
    skills: user.skills ?? [],
    tshirtSize: user.tshirtSize,
    avatarPreset: user.avatarPreset,
    avatarImageUpdatedAt: user.avatarImageUpdatedAt,
    presenceVisibility: user.presenceVisibility,
    emailVerdicts: user.emailVerdicts,
    emailContests: user.emailContests,
    emailClarifications: user.emailClarifications,
    emailReviews: user.emailReviews,
    emailAccount: user.emailAccount,
    emailLearning: user.emailLearning,
    emailAchievements: user.emailAchievements,
    emailAnnouncements: user.emailAnnouncements,
    emailMarketing: user.emailMarketing,
    emailDiscussions: user.emailDiscussions,
    emailMessages: user.emailMessages,
    emailFollows: user.emailFollows,
    notifyMessages: user.notifyMessages,
    notifyFollows: user.notifyFollows,
    notifyMarketing: user.notifyMarketing,
    reviewEmailFrequency: user.reviewEmailFrequency,
    isBanned: user.isBanned,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null },
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    ip: meta.ip ?? null,
    userAgent: meta.userAgent?.slice(0, 300) ?? null,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  const store = await cookies();
  const appUrl = getEnv().APP_URL;
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  await touchPresence(userId);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      rating: users.rating,
      bio: users.bio,
      country: users.country,
      institution: users.institution,
      website: users.website,
      github: users.github,
      linkedin: users.linkedin,
      address: users.address,
      phone: users.phone,
      currentStatus: users.currentStatus,
      companyName: users.companyName,
      jobTitle: users.jobTitle,
      skills: users.skills,
      tshirtSize: users.tshirtSize,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      presenceVisibility: users.presenceVisibility,
      emailVerdicts: users.emailVerdicts,
      emailContests: users.emailContests,
      emailClarifications: users.emailClarifications,
      emailReviews: users.emailReviews,
      emailAccount: users.emailAccount,
      emailLearning: users.emailLearning,
      emailAchievements: users.emailAchievements,
      emailAnnouncements: users.emailAnnouncements,
      emailMarketing: users.emailMarketing,
      emailDiscussions: users.emailDiscussions,
      emailMessages: users.emailMessages,
      emailFollows: users.emailFollows,
      notifyMessages: users.notifyMessages,
      notifyFollows: users.notifyFollows,
      notifyMarketing: users.notifyMarketing,
      reviewEmailFrequency: users.reviewEmailFrequency,
      createdAt: users.createdAt,
      isBanned: users.isBanned,
      emailVerifiedAt: users.emailVerifiedAt,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || row.isBanned) return null;

  // Activity is written at most once a minute (Redis-throttled) and never
  // blocks rendering; presence failures are logged, not surfaced.
  await touchPresence(row.id);
  return toSafeUser(row);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb()
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}
