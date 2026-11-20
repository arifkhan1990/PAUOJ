import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { getEnv } from "@/server/env";

export const SESSION_COOKIE = "pauoj_session";
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
  emailVerdicts: boolean;
  emailContests: boolean;
  emailClarifications: boolean;
  emailReviews: boolean;
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
  emailVerdicts: boolean;
  emailContests: boolean;
  emailClarifications: boolean;
  emailReviews: boolean;
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
    emailVerdicts: user.emailVerdicts,
    emailContests: user.emailContests,
    emailClarifications: user.emailClarifications,
    emailReviews: user.emailReviews,
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
      emailVerdicts: users.emailVerdicts,
      emailContests: users.emailContests,
      emailClarifications: users.emailClarifications,
      emailReviews: users.emailReviews,
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
