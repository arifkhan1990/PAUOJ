import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { authTokens } from "@/server/db/schema";
import type { AuthTokenType } from "@/server/db/schema";

const TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(
  userId: string,
  type: AuthTokenType,
): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type)));
  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MS[type]),
  });
  return token;
}

export async function consumeAuthToken(
  token: string,
  type: AuthTokenType,
): Promise<string | null> {
  if (token.length < 10 || token.length > 500) return null;
  const rows = await getDb()
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(token)),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: authTokens.userId });
  return rows[0]?.userId ?? null;
}
